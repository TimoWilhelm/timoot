// Colorblind-safe palette - vibrant yet readable (safe for deuteranopia, protanopia, tritanopia)

/** SVG paths for answer option shapes */
export const shapePaths = [
	'M12 2L2 22h20L12 2z', // Triangle
	'M12 2l10 10-10 10-10-10L12 2z', // Diamond
	'M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z', // Circle
	'M2 2h20v20H2V2z', // Square
];

/** Tailwind background color classes for answer options */
export const shapeColors = [
	'bg-[#F59E0B]', // Triangle - Golden Amber
	'bg-[#3B82F6]', // Diamond - Sky Blue
	'bg-[#14B8A6]', // Circle - Cyan Teal
	'bg-[#EC4899]', // Square - Hot Pink
];

/** CSS gradient strings for answer option buttons */
export const shapeGradients = [
	'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)', // Triangle - Golden Amber
	'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%)', // Diamond - Sky Blue
	'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 50%, #0D9488 100%)', // Circle - Cyan Teal
	'linear-gradient(135deg, #F472B6 0%, #EC4899 50%, #DB2777 100%)', // Square - Hot Pink
];

/** Hex colors for glow effects */
export const shapeGlowColors = ['#F59E0B', '#3B82F6', '#14B8A6', '#EC4899'];
