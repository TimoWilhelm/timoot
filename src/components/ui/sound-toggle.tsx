import { Volume2, VolumeOff, VolumeX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSoundStore } from '@/lib/sound-store';
import { cn } from '@/lib/utilities';

interface SoundToggleProperties {
	className?: string;
	onToggle?: () => void;
}

export function SoundToggle({ className, onToggle }: SoundToggleProperties) {
	const { isMuted, isBlocked, toggleMute } = useSoundStore();

	const handleClick = () => {
		if (!isBlocked) {
			toggleMute();
		}
		onToggle?.();
	};

	const getIcon = () => {
		if (isBlocked) {
			return <VolumeOff className="size-5 text-red" />;
		}
		if (isMuted) {
			return <VolumeX className="size-5 text-black" />;
		}
		return <Volume2 className="size-5 text-black" />;
	};

	const getAriaLabel = () => {
		if (isBlocked) return 'Enable sounds';
		if (isMuted) return 'Unmute sounds';
		return 'Mute sounds';
	};

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={handleClick}
			className={cn(
				`
					rounded-full border border-slate bg-muted shadow-md backdrop-blur-xs
					hover:scale-105
				`,
				isBlocked && 'animate-pulse ring-2 ring-red',
				className,
			)}
			aria-label={getAriaLabel()}
		>
			{getIcon()}
		</Button>
	);
}
