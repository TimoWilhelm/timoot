export type ImageFit = 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
export type ImageFormat = 'auto' | 'avif' | 'webp' | 'jpeg' | 'json';

export interface ImageOptimizationOptions {
	width?: number;
	height?: number;
	quality?: number;
	format?: ImageFormat;
	fit?: ImageFit;
}

/**
 * Generates a Cloudflare Image Resizing URL.
 * Docs: https://developers.cloudflare.com/images/image-resizing/url-format/
 */
export function getOptimizedImageUrl(source: string, options: ImageOptimizationOptions = {}) {
	// Disable optimizations in development as cdn-cgi is not available
	if (import.meta.env.DEV) {
		return source;
	}

	if (!source || source.startsWith('data:') || source.startsWith('blob:') || source.endsWith('.svg')) {
		return source;
	}

	// Avoid double-optimization
	if (source.includes('/cdn-cgi/image/')) {
		return source;
	}

	const parameters: string[] = [];

	if (options.width) parameters.push(`width=${options.width}`);
	if (options.height) parameters.push(`height=${options.height}`);
	if (options.quality) parameters.push(`quality=${options.quality}`);
	if (options.format) parameters.push(`format=${options.format}`);
	if (options.fit) parameters.push(`fit=${options.fit}`);

	// Default to auto format (WebP/AVIF) if not specified
	if (!options.format) {
		parameters.push('format=auto');
	}

	const optionsString = parameters.join(',');

	// If source is an absolute URL (http/https), we prepend /cdn-cgi/image/...
	// Note: 'Resize images from any origin' must be enabled in Cloudflare dashboard,
	// or the domain must be in the allowed list.
	if (source.startsWith('http')) {
		return `/cdn-cgi/image/${optionsString}/${source}`;
	}

	// If source is a relative path (e.g. /images/foo.jpg)
	// We want /cdn-cgi/image/.../images/foo.jpg
	// Note: We strip the leading slash to avoid double slashes if needed,
	// but standard behavior usually handles /cdn-cgi/image/options//path well too?
	// Actually, Cloudflare examples show: /cdn-cgi/image/width=80,quality=75/uploads/avatar.png
	// So if source is "/uploads/avatar.png", we need to remove the leading slash or perform join carefully.
	// Let's strip the leading slash to be clean.
	const cleanSource = source.startsWith('/') ? source.slice(1) : source;
	return `/cdn-cgi/image/${optionsString}/${cleanSource}`;
}
