import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSoundStore } from '@/lib/sound-store';
import { cn } from '@/lib/utils';

interface SoundToggleProps {
	className?: string;
	onToggle?: () => void;
}

export function SoundToggle({ className, onToggle }: SoundToggleProps) {
	const { isMuted, toggleMute } = useSoundStore();

	const handleClick = () => {
		toggleMute();
		onToggle?.();
	};

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={handleClick}
			className={cn('h-10 w-10 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:scale-105', className)}
			aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
		>
			{isMuted ? <VolumeX className="h-5 w-5 text-slate-500" /> : <Volume2 className="h-5 w-5 text-quiz-orange" />}
		</Button>
	);
}
