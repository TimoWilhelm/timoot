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
			return <VolumeOff className="size-5 text-red-500" />;
		}
		if (isMuted) {
			return <VolumeX className="size-5 text-slate-500" />;
		}
		return <Volume2 className="size-5 text-quiz-orange" />;
	};

	const getAriaLabel = () => {
		if (isBlocked) return 'Enable sounds';
		if (isMuted) return 'Unmute sounds';
		return 'Mute sounds';
	};

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={handleClick}
			className={cn(
				`
					size-10 rounded-full bg-white/90 shadow-md backdrop-blur-xs transition-all
					hover:scale-105
				`,
				isBlocked && 'animate-pulse ring-2 ring-red-400',
				className,
			)}
			aria-label={getAriaLabel()}
		>
			{getIcon()}
		</Button>
	);
}
