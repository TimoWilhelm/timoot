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

	it('rotates phrases through a fixed two-line viewport with overlapping motion', async () => {
		vi.useFakeTimers();
		render(<MagicQuizStatus prompt="Space" status={{ stage: 'researching' }} />);

		const status = screen.getByRole('status');
		expect(status).toHaveTextContent('Researching Space…');
		expect(status.querySelectorAll('.shimmer-text')).toHaveLength(1);
		const viewport = status.querySelector('[aria-hidden="true"]');
		expect(viewport).toHaveClass('h-10', 'overflow-hidden');
		expect(status.querySelector('.shimmer-text')).toHaveClass('line-clamp-2', 'whitespace-normal');

		await act(() => vi.advanceTimersByTimeAsync(5100));

		expect(status).toHaveTextContent('Understanding Space, allegedly…');
		expect(status.querySelectorAll('.shimmer-text')).toHaveLength(2);
	});
});
