import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getThemeColor(variable: string) {
	if (globalThis.window === undefined) return '';
	return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}
