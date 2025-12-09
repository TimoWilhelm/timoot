/**
 * Default background images available for questions.
 * These are served from /images/ in the public folder.
 */
export interface BackgroundImage {
	id: string;
	name: string;
	path: string;
}

export const DEFAULT_BACKGROUND_IMAGES: BackgroundImage[] = [
	{
		id: 'party',
		name: 'Party',
		path: '/images/party.jpg',
	},
	{
		id: 'sunset',
		name: 'Sunset',
		path: '/images/sunset.jpg',
	},
	{
		id: 'tech',
		name: 'Tech',
		path: '/images/tech.jpg',
	},
];

/**
 * Get a background image by its ID
 */
function getBackgroundImageById(id: string): BackgroundImage | undefined {
	return DEFAULT_BACKGROUND_IMAGES.find((img) => img.id === id);
}

/**
 * Get the path for a background image by ID
 */
export function getBackgroundImagePath(id: string): string | undefined {
	return getBackgroundImageById(id)?.path;
}
