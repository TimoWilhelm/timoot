import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

interface ThemeToggleProps {
	className?: string;
}

export function ThemeToggle({ className = 'absolute top-4 right-4' }: ThemeToggleProps) {
	const { isDark, toggleTheme } = useTheme();

	return (
		<Button
			onClick={toggleTheme}
			variant="ghost"
			size="icon"
			className={`${className} z-50 text-2xl transition-all duration-200 hover:rotate-12 hover:scale-110 active:scale-90`}
		>
			{isDark ? '☀️' : '🌙'}
		</Button>
	);
}
