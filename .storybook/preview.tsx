import type { Preview } from '@storybook/react-vite';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import '../src/index.css';

const preview: Preview = {
	parameters: {
		backgrounds: {
			default: 'light',
			values: [
				{
					name: 'light',
					value: '#ffffff',
				},
				{
					name: 'dark',
					value: '#000000',
				},
			],
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		layout: 'fullscreen',
	},
	decorators: [
		(Story, context) => {
			const { backgrounds } = context.parameters;
			const defaultName = backgrounds?.default;
			const selectedValue = backgrounds?.values?.find((v: { name: string; value: string }) => v.name === defaultName)?.value;

			React.useEffect(() => {
				document.body.style.backgroundColor = selectedValue || '#ffffff';
				return () => {
					document.body.style.backgroundColor = '';
				};
			}, [selectedValue]);

			return (
				<MemoryRouter>
					<Story />
				</MemoryRouter>
			);
		},
	],
};

export default preview;
