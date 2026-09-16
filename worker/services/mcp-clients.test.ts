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
});
