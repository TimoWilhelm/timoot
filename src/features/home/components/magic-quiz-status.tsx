import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utilities';

import { getMagicQuizStatusPhrases } from './magic-quiz-status-phrases';

import type { GenerationStatus } from '@shared/types';

const PHRASE_DURATION_MS = 3200;

interface MagicQuizStatusProperties {
	prompt: string;
	status?: GenerationStatus;
	className?: string;
}

export function MagicQuizStatus({ prompt, status, className }: MagicQuizStatusProperties) {
	const prefersReducedMotion = useReducedMotion();
	const phrases = getMagicQuizStatusPhrases(prompt, status);
	const phrasesKey = phrases.join('\u0000');
	const [rotation, setRotation] = useState({ phrasesKey, index: 0 });

	if (rotation.phrasesKey !== phrasesKey) {
		setRotation({ phrasesKey, index: 0 });
	}

	const activeIndex = rotation.phrasesKey === phrasesKey ? rotation.index : 0;
	const activePhrase = phrases[activeIndex % phrases.length];

	useEffect(() => {
		if (phrases.length <= 1) return;

		const interval = setInterval(() => {
			setRotation((current) => ({
				phrasesKey,
				index: current.phrasesKey === phrasesKey ? (current.index + 1) % phrases.length : 0,
			}));
		}, PHRASE_DURATION_MS);

		return () => clearInterval(interval);
	}, [phrases.length, phrasesKey]);

	return (
		<div role="status" aria-live="polite" className={cn('relative h-5 w-full overflow-hidden', className)}>
			<motion.span
				key={activePhrase}
				initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: 'easeOut' }}
				className="shimmer-text absolute inset-x-0 top-0 max-w-full truncate"
			>
				{activePhrase}
			</motion.span>
		</div>
	);
}
