/* eslint-disable unicorn/prevent-abbreviations */

/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ViteTypeOptions {
	strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
	readonly VITE_TURNSTILE_SITE_KEY: string;
	readonly VITE_SENTRY_DSN: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
