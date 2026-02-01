import { motion } from 'motion/react';

import { EMOJI_REACTIONS, type EmojiReaction } from '@shared/types';

interface EmojiPickerProperties {
	onEmojiSelect: (emoji: EmojiReaction) => void;
	disabled?: boolean;
}

export function EmojiPicker({ onEmojiSelect, disabled }: EmojiPickerProperties) {
	return (
		<div className="flex justify-center gap-2">
			{EMOJI_REACTIONS.map((emoji) => (
				<motion.button
					key={emoji}
					whileTap={{ scale: 0.85 }}
					whileHover={{ scale: 1.1 }}
					onClick={() => onEmojiSelect(emoji)}
					disabled={disabled}
					className={`
						cursor-pointer p-2 text-4xl transition-opacity
						disabled:opacity-50
					`}
					aria-label={`Send ${emoji} reaction`}
				>
					{emoji}
				</motion.button>
			))}
		</div>
	);
}
