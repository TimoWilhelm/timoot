// Colorblind-safe palette - vibrant yet readable (safe for deuteranopia, protanopia, tritanopia)

/** SVG paths for answer option shapes */
export const shapePaths = [
	'M12 2L2 22h20L12 2z', // Triangle
	'M12 2l10 10-10 10-10-10L12 2z', // Diamond
	'M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z', // Circle
	'M2 2h20v20H2V2z', // Square
] as const;

/** Tailwind background color classes for answer options */
export const shapeColors = [
	'bg-yellow', // Triangle - Golden Amber
	'bg-blue', // Diamond - Sky Blue
	'bg-green', // Circle - Cyan Teal
	'bg-pink', // Square - Hot Pink
] as const;
