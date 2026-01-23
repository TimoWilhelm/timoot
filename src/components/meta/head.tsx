import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

import { getManifestContent } from '@/lib/seo/manifest';

import type { Thing, WithContext } from 'schema-dts';

interface HeadProperties {
	title: string;
	description?: string;
	image?: string;
	type?: 'website' | 'article' | 'game';
	jsonLd?: WithContext<Thing> | WithContext<Thing>[];
}

export function Head({ title, description, image, type = 'website', jsonLd }: HeadProperties) {
	const location = useLocation();

	const origin = globalThis.location?.origin ?? 'https://timoot.com'; // Fallback for SSR if needed, though this seems client-side
	const url = `${origin}${location.pathname}`;
	const metaImage = image ? (image.startsWith('http') ? image : `${origin}${image}`) : `${origin}/favicon/timoot.svg`;
	const manifest = getManifestContent(origin);
	const manifestHref = `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`;

	return (
		<Helmet>
			{/* Title */}
			<title key="title">{title}</title>
			{/* Canonical */}
			<link rel="canonical" href={url} key="canonical" />

			{/* Standard */}
			{description && <meta name="description" content={description} key="description" />}

			{/* OpenGraph */}
			<meta property="og:title" content={title} key="og:title" />
			{description && <meta property="og:description" content={description} key="og:description" />}
			<meta property="og:type" content={type} key="og:type" />
			<meta property="og:site_name" content="Timoot" key="og:site_name" />
			<meta property="og:url" content={url} key="og:url" />
			<meta property="og:image" content={metaImage} key="og:image" />

			{/* Twitter */}
			<meta name="twitter:card" content="summary_large_image" key="twitter:card" />
			<meta name="twitter:title" content={title} key="twitter:title" />
			{description && <meta name="twitter:description" content={description} key="twitter:description" />}
			<meta name="twitter:image" content={metaImage} key="twitter:image" />

			{/* Dynamic Manifest */}
			<link rel="manifest" href={manifestHref} key="manifest" />

			{/* LD-JSON */}
			{jsonLd && (
				<script type="application/ld+json" key="json-ld">
					{JSON.stringify(jsonLd)}
				</script>
			)}
		</Helmet>
	);
}
