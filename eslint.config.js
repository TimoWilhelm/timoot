/* eslint-disable import/no-named-as-default-member */

import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactCompiler from 'eslint-plugin-react-compiler';
import tseslint from 'typescript-eslint';
import storybook from 'eslint-plugin-storybook';
import { FlatCompat } from '@eslint/eslintrc';
import unusedImports from 'eslint-plugin-unused-imports';
import unicorn from 'eslint-plugin-unicorn';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
});

const eslintImport = [
	...compat.config({
		extends: ['plugin:import/recommended', 'plugin:import/typescript'],
	}),
];

export default defineConfig(
	{ ignores: ['dist', '.wrangler', 'worker-configuration.d.ts', '.storybook', 'vitest.config.storybook.ts'] },

	js.configs.recommended,

	tseslint.configs.recommended,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2022,
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},

		rules: {
			'@typescript-eslint/no-floating-promises': 'error',
		},
	},

	unicorn.configs.recommended,
	{
		rules: {
			// Disable rules that require major refactoring or ES2023+ features
			'unicorn/prevent-abbreviations': [
				'error',
				{
					allowList: {
						// Allow common abbreviations
						env: true,
						Env: true,
						props: true,
						Props: true,
						ref: true,
						Ref: true,
						params: true,
						Params: true,
						args: true,
						Args: true,
						res: true,
						req: true,
						docs: true,
						Docs: true,
					},
					ignore: [
						// Ignore file naming rules for these patterns
						'vite-env',
						String.raw`\.d\.ts$`,
						'utils',
					],
				},
			],
			'unicorn/consistent-function-scoping': 'off', // Would require significant refactoring
			'unicorn/no-array-sort': 'off', // toSorted requires ES2023
			'unicorn/prefer-top-level-await': 'off', // Not all contexts support top-level await
			'unicorn/import-style': 'off', // Conflicts with some import patterns
			'unicorn/no-anonymous-default-export': 'off', // Vite config pattern
			'unicorn/prefer-code-point': 'off', // codePointAt vs charCodeAt
			'unicorn/no-array-reduce': 'off', // reduce is sometimes clearer
			'unicorn/no-await-expression-member': 'off', // Pattern is common and readable
			'unicorn/prefer-add-event-listener': 'off', // WebSocket patterns use onmessage/onerror
		},
	},

	reactHooks.configs.flat.recommended,
	reactRefresh.configs.vite,
	reactCompiler.configs.recommended,

	eslintImport,
	{
		settings: {
			'import/resolver': {
				typescript: true,
				node: true,
			},
		},
		rules: {
			'import/order': 'error',
			'import/no-unresolved': [
				'error',
				{
					ignore: ['cloudflare:workers'],
				},
			],
		},
	},
	{
		plugins: {
			'unused-imports': unusedImports,
		},
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_',
				},
			],
		},
	},

	storybook.configs['flat/recommended'],

	eslintConfigPrettier,
);
