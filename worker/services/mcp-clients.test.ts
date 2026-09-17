import { loadAvailableMCPResources } from './mcp-clients';

describe('loadAvailableMCPResources', () => {
	it('keeps successful clients when another server is unavailable', async () => {
		const availableClient = { close: vi.fn() };
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const clients = await loadAvailableMCPResources([
			{ name: 'available', load: vi.fn().mockResolvedValue(availableClient) },
			{ name: 'blocked', load: vi.fn().mockRejectedValue(new Error('HTTP 403')) },
		]);

		expect(clients).toEqual([{ name: 'available', value: availableClient }]);
		expect(warn).toHaveBeenCalledWith('[AI Research MCP Unavailable]', {
			server: 'blocked',
			error: 'HTTP 403',
		});
	});

	it('allows generation to continue when every research server is unavailable', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const clients = await loadAvailableMCPResources([{ name: 'blocked', load: vi.fn().mockRejectedValue('blocked') }]);

		expect(clients).toEqual([]);
	});

	it('stops waiting for an unresponsive research server', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const clients = await loadAvailableMCPResources([{ name: 'sleepy', load: () => new Promise(() => {}) }], { timeoutMs: 5 });

		expect(clients).toEqual([]);
		expect(warn).toHaveBeenCalledWith('[AI Research MCP Unavailable]', {
			server: 'sleepy',
			error: 'sleepy timed out after 5ms',
		});
	});

	it('propagates cancellation to resource loaders', async () => {
		const controller = new AbortController();
		const load = vi.fn((abortSignal?: AbortSignal) => {
			return new Promise<never>((_resolve, reject) => abortSignal?.addEventListener('abort', () => reject(abortSignal.reason)));
		});
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const clientsPromise = loadAvailableMCPResources([{ name: 'cancelled', load }], { abortSignal: controller.signal });
		controller.abort(new Error('request cancelled'));

		await expect(clientsPromise).rejects.toThrow('request cancelled');
		expect(load).toHaveBeenCalledWith(expect.any(AbortSignal));
	});
});
