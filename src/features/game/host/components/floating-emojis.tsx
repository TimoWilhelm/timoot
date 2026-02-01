import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useImperativeHandle, useState } from 'react';

import type { EmojiReaction } from '@shared/types';

interface FloatingEmoji {
	id: string;
	emoji: EmojiReaction;
	x: number; // percentage from left (0-100)
	duration: number; // randomized animation duration
}

export interface FloatingEmojisHandle {
	addEmoji: (emoji: EmojiReaction) => void;
	clearAll: () => void;
}

export function FloatingEmojis({ ref }: { ref?: React.Ref<FloatingEmojisHandle> }) {
	const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
	const [clearing, setClearing] = useState(false);

	const addEmoji = useCallback((emoji: EmojiReaction) => {
		const id = `${Date.now()}-${Math.random()}`;
		const x = 10 + Math.random() * 80; // Random position 10-90%
		const duration = 3 + Math.random() * 1.5; // Random 3-4.5 seconds

		setEmojis((previous) => [...previous, { id, emoji, x, duration }]);

		// Auto-remove after animation completes
		setTimeout(() => {
			setEmojis((previous) => previous.filter((emoji) => emoji.id !== id));
		}, duration * 1000);
	}, []);

	const clearAll = useCallback(() => {
		setClearing(true);
		// Quick fade out then clear
		setTimeout(() => {
			setEmojis([]);
			setClearing(false);
		}, 300);
	}, []);

	useImperativeHandle(ref, () => ({
		addEmoji,
		clearAll,
	}));

	return (
		<div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
			<AnimatePresence>
				{emojis.map(({ id, emoji, x, duration }) => (
					<motion.div
						key={id}
						initial={{ y: 0, opacity: 1, scale: 0.5 }}
						animate={{
							y: clearing ? 100 : '-100vh', // Float up past the top of the screen
							opacity: clearing ? 0 : [1, 1, 0, 0], // Fade: full until 50%, fade to 0 at 75%, stay at 0
							scale: clearing ? 0.5 : [1, 1.3, 1],
						}}
						exit={{ opacity: 0 }}
						transition={{
							duration: clearing ? 0.3 : duration,
							ease: 'easeOut',
							scale: { duration: 0.2 },
							opacity: {
								duration: clearing ? 0.3 : duration,
								times: [0, 0.1, 0.3, 1],
								ease: 'linear',
							},
						}}
						style={{ left: `${x}%` }}
						className="absolute bottom-4 text-5xl"
					>
						{emoji}
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}
