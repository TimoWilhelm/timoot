import { Volume2, VolumeOff, VolumeX } from 'lucide-react';

import { Button } from '@/components/button';
import { Toggle } from '@/components/toggle';
import { useSoundStore } from '@/lib/stores/sound-store';
import { cn } from '@/lib/utilities';

interface SoundToggleProperties {
	className?: string;
	onToggle?: () => void;
}

export function SoundToggle({ className, onToggle }: SoundToggleProperties) {
	const { isMuted, isBlocked, toggleMute } = useSoundStore();

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
		return 'Mute sounds';
	};

	return (
		<Toggle
			asChild
			pressed={isMuted}
			onPressedChange={() => {
				if (!isBlocked) {
					toggleMute();
				}
				onToggle?.();
			}}
			aria-pressed={isBlocked ? undefined : isMuted}
		>
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
				aria-label={getAriaLabel()}
			>
				{getIcon()}
			</Button>
		</Toggle>
	);
}
