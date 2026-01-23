/*
 * https://www.w3.org/TR/appmanifest/
 * https://developer.mozilla.org/en-US/docs/Web/Manifest
 */
interface Manifest {
	id: string;
	start_url: string;
	scope: string;
	name: string;
	short_name: string;
	description: string;
	display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
	display_override: string[];
	orientation:
		| 'any'
		| 'natural'
		| 'landscape'
		| 'landscape-primary'
		| 'landscape-secondary'
		| 'portrait'
		| 'portrait-primary'
		| 'portrait-secondary';
	theme_color: string;
	background_color: string;
	icons: {
		src: string;
		sizes: string;
		type: string;
		purpose: 'any' | 'maskable';
	}[];
}

export function getManifestContent(origin: string): Manifest {
	return {
		id: 'a4b945bd-512a-4819-b8aa-f8cc393b5c10',
		name: 'Timoot',
		short_name: 'Timoot',
		description: 'A fun multiplayer quiz game',
		orientation: 'natural',
		start_url: `${origin}/`,
		scope: `${origin}/`,
		display: 'standalone',
		display_override: ['window-controls-overlay'],
		background_color: '#ffffff',
		theme_color: '#f48120',
		icons: [
			{
				src: new URL('/favicon/timoot.svg', origin).href,
				sizes: 'any',
				type: 'image/svg+xml',
				purpose: 'any',
			},
		],
	};
}
