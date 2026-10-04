import { act, cleanup, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePwaUpdate } from './use-pwa-update';

const { toastInfoMock, updateServiceWorkerMock, useRegisterSWMock } = vi.hoisted(() => ({
	toastInfoMock: vi.fn<(message: string, options: { action: { label: string; onClick: () => void } }) => void>(),
	updateServiceWorkerMock: vi.fn<() => Promise<void>>(),
	useRegisterSWMock: vi.fn(),
}));

vi.mock('@/components/toast', () => ({ toast: { info: toastInfoMock } }));
vi.mock('@/lib/pwa-register', () => ({ useRegisterSW: useRegisterSWMock }));

interface MockRegistration {
	update: () => Promise<void>;
	installing?: object;
}

interface RegisterOptions {
	onRegisteredSW: (serviceWorkerUrl: string, registration?: MockRegistration) => void;
}

function getReloadAction() {
	const toastCall = toastInfoMock.mock.calls[0];
	if (!toastCall) throw new Error('Expected an update prompt');
	expect(toastCall[0]).toBe('New version available');
	expect(toastCall[1].action.label).toBe('Reload');
	return toastCall[1].action.onClick;
}

describe('usePwaUpdate', () => {
	let registerOptions: RegisterOptions;
	let registration: MockRegistration;
	let needRefresh: boolean;
	const registrationUpdateMock = vi.fn<() => Promise<void>>();
	const fetchMock = vi.fn<typeof fetch>();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.resetAllMocks();
		needRefresh = false;
		registration = { update: registrationUpdateMock };
		registrationUpdateMock.mockResolvedValue();
		updateServiceWorkerMock.mockResolvedValue();
		fetchMock.mockResolvedValue(new Response(undefined, { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
		useRegisterSWMock.mockImplementation((options: RegisterOptions) => {
			registerOptions = options;
			return { needRefresh: [needRefresh, vi.fn()], updateServiceWorker: updateServiceWorkerMock };
		});
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('prompts for a waiting update at startup without automatically activating it', () => {
		needRefresh = true;
		renderHook(() => usePwaUpdate());
		expect(toastInfoMock).toHaveBeenCalledOnce();
		expect(updateServiceWorkerMock).not.toHaveBeenCalled();
	});

	it('prompts for an update arriving immediately after startup', () => {
		const { rerender } = renderHook(() => usePwaUpdate());
		needRefresh = true;
		rerender();
		expect(toastInfoMock).toHaveBeenCalledOnce();
		expect(updateServiceWorkerMock).not.toHaveBeenCalled();
	});

	it('prompts for a mid-session update without automatically activating it', () => {
		const { rerender } = renderHook(() => usePwaUpdate());
		act(() => {
			vi.advanceTimersByTime(10_000);
		});
		needRefresh = true;
		rerender();
		expect(toastInfoMock).toHaveBeenCalledOnce();
		expect(updateServiceWorkerMock).not.toHaveBeenCalled();
	});

	it('requests activation once only when Reload is chosen', async () => {
		needRefresh = true;
		renderHook(() => usePwaUpdate());
		const reloadAction = getReloadAction();
		await act(async () => {
			reloadAction();
			reloadAction();
		});
		expect(updateServiceWorkerMock).toHaveBeenCalledExactlyOnceWith(true);
	});

	it('does not duplicate the startup prompt in Strict Mode', () => {
		needRefresh = true;
		const { rerender } = renderHook(() => usePwaUpdate(), { wrapper: StrictMode });
		rerender();
		expect(toastInfoMock).toHaveBeenCalledOnce();
		expect(updateServiceWorkerMock).not.toHaveBeenCalled();
	});

	it('allows retrying a failed activation', async () => {
		updateServiceWorkerMock.mockRejectedValueOnce(new Error('Unavailable'));
		needRefresh = true;
		renderHook(() => usePwaUpdate());
		const reloadAction = getReloadAction();
		await act(async () => reloadAction());
		await act(async () => reloadAction());
		expect(updateServiceWorkerMock).toHaveBeenCalledTimes(2);
	});

	it('checks every five minutes without activating an update', async () => {
		renderHook(() => usePwaUpdate());
		registerOptions.onRegisteredSW('/sw.js', registration);
		expect(registrationUpdateMock).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		expect(registrationUpdateMock).toHaveBeenCalledOnce();
		expect(updateServiceWorkerMock).not.toHaveBeenCalled();
	});

	it('keeps polling after network and registration update failures', async () => {
		fetchMock.mockRejectedValueOnce(new Error('Offline'));
		registrationUpdateMock.mockRejectedValueOnce(new Error('Unavailable'));
		renderHook(() => usePwaUpdate());
		registerOptions.onRegisteredSW('/sw.js', registration);
		await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		expect(registrationUpdateMock).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		expect(registrationUpdateMock).toHaveBeenCalledTimes(2);
	});

	it('skips polling while offline or installing', async () => {
		renderHook(() => usePwaUpdate());
		registerOptions.onRegisteredSW('/sw.js', registration);
		vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
		await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
		registration.installing = {};
		await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('replaces duplicate polling timers and stops polling after unmount', async () => {
		const { unmount } = renderHook(() => usePwaUpdate());
		registerOptions.onRegisteredSW('/sw.js', registration);
		registerOptions.onRegisteredSW('/sw.js', registration);
		await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		expect(fetchMock).toHaveBeenCalledOnce();
		unmount();
		await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('ignores late registration and stale toast actions after unmount', async () => {
		needRefresh = true;
		const { unmount } = renderHook(() => usePwaUpdate());
		const reloadAction = getReloadAction();
		unmount();
		registerOptions.onRegisteredSW('/sw.js', registration);
		reloadAction();
		await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
		expect(registrationUpdateMock).not.toHaveBeenCalled();
		expect(updateServiceWorkerMock).not.toHaveBeenCalled();
	});
});
