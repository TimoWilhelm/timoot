import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MagicQuizStatus } from './magic-quiz-status';
import { getMagicQuizStatusPhrases } from './magic-quiz-status-phrases';

describe('MagicQuizStatus', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('uses fun phrases that reflect the current generation stage', () => {
		expect(getMagicQuizStatusPhrases('Space', { stage: 'researching' })).toEqual([
			'Researching Space…',
			'Understanding Space, allegedly…',
			'Grokking Space…',
		]);
		expect(getMagicQuizStatusPhrases('Space', { stage: 'generating' })).toContain('Hallucinating questions—responsibly…');
	});

	it('shows one shiny phrase at a time and rotates after a few seconds', async () => {
		vi.useFakeTimers();
		render(<MagicQuizStatus prompt="Space" status={{ stage: 'researching' }} />);

		const status = screen.getByRole('status');
		expect(status).toHaveTextContent('Researching Space…');
		expect(status.querySelectorAll('.shimmer-text')).toHaveLength(1);

		await act(() => vi.advanceTimersByTimeAsync(3400));

		expect(status).toHaveTextContent('Understanding Space, allegedly…');
		expect(status.querySelectorAll('.shimmer-text')).toHaveLength(1);
	});
});
