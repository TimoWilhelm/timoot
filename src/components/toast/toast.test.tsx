import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from './toast';

const sonnerMocks = vi.hoisted(() => ({
	custom: vi.fn<(renderToast: (toastId: string | number) => React.ReactNode) => void>(),
	dismiss: vi.fn<(toastId: string | number) => void>(),
}));

vi.mock('sonner', () => ({ toast: sonnerMocks }));

function renderLatestToast() {
	const latestCall = sonnerMocks.custom.mock.calls.at(-1);
	if (!latestCall) throw new Error('Expected a toast renderer');
	return render(latestCall[0](42));
}

describe('toast', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('always renders its dismiss control as a ghost icon button', () => {
		toast.success('Quiz generated');
		renderLatestToast();

		const dismissButton = screen.getByRole('button', { name: 'Dismiss notification' });
		expect(dismissButton).toHaveClass('size-10', 'border-transparent');
		expect(dismissButton).not.toHaveClass('opacity-0');

		fireEvent.click(dismissButton);
		expect(sonnerMocks.dismiss).toHaveBeenCalledWith(42);
	});

	it('runs and dismisses a toast action', () => {
		const onClick = vi.fn();
		toast.success('Quiz generated', { action: { label: 'Play', onClick } });
		renderLatestToast();

		fireEvent.click(screen.getByRole('button', { name: 'Play' }));
		expect(onClick).toHaveBeenCalledOnce();
		expect(sonnerMocks.dismiss).toHaveBeenCalledWith(42);
	});
});
