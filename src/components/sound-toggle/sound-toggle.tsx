import { Volume2, VolumeOff, VolumeX } from 'lucide-react';

import { Button } from '@/components/button';
import { Toggle } from '@/components/toggle';
import { useSoundStore } from '@/lib/stores/sound-store';
import { cn } from '@/lib/utilities';

// ============================================================================
// Types
// ============================================================================

interface SoundToggleProperties {
	readonly className?: string;
	readonly onToggle?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/** Sound mute/unmute toggle button with visual feedback for blocked audio state. */
export function SoundToggle({ className, onToggle }: SoundToggleProperties) {
	const { isMuted, isBlocked, toggleMute } = useSoundStore();

	const icon = isBlocked ? (
		<VolumeOff className="size-5 text-red" />
	) : isMuted ? (
		<VolumeX className="size-5 text-black" />
	) : (
		<Volume2 className="size-5 text-black" />
	);

	const ariaLabel = isBlocked ? 'Enable sounds' : 'Mute sounds';

	const handlePressedChange = () => {
		if (!isBlocked) {
			toggleMute();
		}
		onToggle?.();
	};

	return (
		<Toggle asChild pressed={isMuted} onPressedChange={handlePressedChange} aria-pressed={isBlocked ? undefined : isMuted}>
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					`
						rounded-full border border-slate bg-muted shadow-md backdrop-blur-xs
						hover:scale-105
						active:scale-95
					`,
					isBlocked && 'animate-pulse ring-2 ring-red',
					className,
				)}
				aria-label={ariaLabel}
			>
				{icon}
			</Button>
		</Toggle>
	);
}
