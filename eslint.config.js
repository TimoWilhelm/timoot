import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import { importX } from 'eslint-plugin-import-x';
import reactCompiler from 'eslint-plugin-react-compiler';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import storybook from 'eslint-plugin-storybook';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
	{ ignores: ['dist', '.wrangler', 'worker-configuration.d.ts', '.storybook'] },

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

	importX.flatConfigs.recommended,
	{
		settings: {
			'import-x/resolver-next': [
				createTypeScriptImportResolver({
					alwaysTryTypes: true,
					bun: true,
					project: import.meta.dirname,
				}),
			],
		},
		rules: {
			'import-x/order': [
				'error',
				{
					groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'type'],
					'newlines-between': 'always',
					alphabetize: {
						order: 'asc',
						caseInsensitive: true,
					},
				},
			],
			'import-x/no-unresolved': [
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

	{
		files: ['**/*.{ts,tsx}'],
		plugins: {
			'better-tailwindcss': eslintPluginBetterTailwindcss,
		},
		rules: {
			...eslintPluginBetterTailwindcss.configs['recommended-warn'].rules,
			...eslintPluginBetterTailwindcss.configs['recommended-error'].rules,
			'better-tailwindcss/enforce-consistent-line-wrapping': [
				'error',
				{
					indent: 'tab',
					strictness: 'loose',
				},
			],
		},
		settings: {
			'better-tailwindcss': {
				entryPoint: 'src/index.css',
			},
		},
	},
);
