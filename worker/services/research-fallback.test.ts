import { runWithResearchFallback } from './research-fallback';

describe('runWithResearchFallback', () => {
	it('returns the operation result', async () => {
		await expect(
			runWithResearchFallback({
				fallback: 'fallback',
				operation: () => 'research',
				source: 'test',
			}),
		).resolves.toBe('research');
	});

	it('returns the fallback when research fails', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		await expect(
			runWithResearchFallback({
				fallback: 'fallback',
				operation: () => Promise.reject(new Error('unavailable')),
				source: 'wikimedia',
			}),
		).resolves.toBe('fallback');
		expect(warn).toHaveBeenCalledWith('[AI Research Unavailable]', {
			source: 'wikimedia',
			error: 'unavailable',
		});
	});

	it('does not swallow cancellation', async () => {
		const abortController = new AbortController();
		abortController.abort();
		const cancellation = new Error('cancelled');

		await expect(
			runWithResearchFallback({
				abortSignal: abortController.signal,
				fallback: 'fallback',
				operation: () => Promise.reject(cancellation),
				source: 'wikipedia',
			}),
		).rejects.toBe(cancellation);
	});
});
