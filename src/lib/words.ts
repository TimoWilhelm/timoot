// Word lists for game ID validation and autocomplete
// These match the words used in worker/words.ts to generate game IDs

export const adjectives = [
	'Happy',
	'Silly',
	'Funny',
	'Clever',
	'Brave',
	'Calm',
	'Eager',
	'Gentle',
	'Jolly',
	'Kind',
	'Lively',
	'Nice',
	'Proud',
	'Swift',
	'Witty',
	'Zany',
	'Bright',
	'Bold',
	'Cozy',
	'Dapper',
	'Fancy',
	'Gleaming',
	'Huge',
	'Icy',
	'Jumbo',
	'Kooky',
	'Lucky',
	'Mighty',
	'Neat',
	'Plucky',
	'Quick',
	'Shiny',
	'Tiny',
	'Vast',
	'Wild',
	'Young',
	'Zesty',
	'Canny',
	'Dandy',
	'Epic',
];

export const colors = [
	'Red',
	'Blue',
	'Green',
	'Yellow',
	'Purple',
	'Orange',
	'Pink',
	'Black',
	'White',
	'Brown',
	'Gray',
	'Cyan',
	'Magenta',
	'Lime',
	'Maroon',
	'Navy',
	'Olive',
	'Teal',
	'Violet',
	'Gold',
	'Silver',
	'Indigo',
	'Coral',
	'Turquoise',
	'Lavender',
	'Beige',
	'Crimson',
	'Fuchsia',
	'Khaki',
	'Plum',
];

export const animals = [
	'Lion',
	'Tiger',
	'Bear',
	'Wolf',
	'Fox',
	'Eagle',
	'Shark',
	'Panda',
	'Koala',
	'Zebra',
	'Giraffe',
	'Hippo',
	'Rhino',
	'Monkey',
	'Gorilla',
	'Jaguar',
	'Leopard',
	'Panther',
	'Cheetah',
	'Hyena',
	'Dolphin',
	'Whale',
	'Octopus',
	'Squid',
	'Penguin',
	'Ostrich',
	'Kangaroo',
	'Wombat',
	'Platypus',
	'Badger',
	'Llama',
	'Alpaca',
	'Bison',
	'Cobra',
	'Gecko',
	'Iguana',
	'Newt',
	'Parrot',
	'Quail',
	'Toucan',
];

// Helper to validate a word against a list (case-insensitive)
export function isValidWord(word: string, list: string[]): boolean {
	return list.some((w) => w.toLowerCase() === word.toLowerCase());
}

// Helper to find matching words for autocomplete
export function findMatches(input: string, list: string[]): string[] {
	if (!input) return list;
	const lower = input.toLowerCase();
	return list.filter((w) => w.toLowerCase().startsWith(lower));
}

// Validate a complete game ID
export function isValidGameId(gameId: string): boolean {
	const parts = gameId.toLowerCase().split('-');
	if (parts.length !== 3) return false;
	return isValidWord(parts[0], adjectives) && isValidWord(parts[1], colors) && isValidWord(parts[2], animals);
}

// Determine which word list to use based on current position
export function getWordListForPosition(parts: string[]): { list: string[]; label: string } | undefined {
	if (parts.length === 1) return { list: adjectives, label: 'Adjective' };
	if (parts.length === 2) return { list: colors, label: 'Color' };
	if (parts.length === 3) return { list: animals, label: 'Animal' };
	return undefined;
}

// Generate a random placeholder example
export function generateRandomPlaceholder(): string {
	const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)].toLowerCase();
	const randomColor = colors[Math.floor(Math.random() * colors.length)].toLowerCase();
	const randomAnimal = animals[Math.floor(Math.random() * animals.length)].toLowerCase();
	return `${randomAdj}-${randomColor}-${randomAnimal}`;
}
