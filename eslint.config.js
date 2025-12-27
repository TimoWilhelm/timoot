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
