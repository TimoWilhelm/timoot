import { Volume2, VolumeX, VolumeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSoundStore } from '@/lib/sound-store';
import { cn } from '@/lib/utils';

interface SoundToggleProps {
	className?: string;
	onToggle?: () => void;
}

export function SoundToggle({ className, onToggle }: SoundToggleProps) {
	const { isMuted, isBlocked, toggleMute } = useSoundStore();

	const handleClick = () => {
		if (!isBlocked) {
			toggleMute();
		}
		onToggle?.();
	};

	const getIcon = () => {
		if (isBlocked) {
			return <VolumeOff className="h-5 w-5 text-red-500" />;
		}
		if (isMuted) {
			return <VolumeX className="h-5 w-5 text-slate-500" />;
		}
		return <Volume2 className="h-5 w-5 text-quiz-orange" />;
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
				'h-10 w-10 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:scale-105',
				isBlocked && 'animate-pulse ring-2 ring-red-400',
				className,
			)}
			aria-label={getAriaLabel()}
		>
			{getIcon()}
		</Button>
	);
}
