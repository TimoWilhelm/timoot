import { env } from 'cloudflare:workers';
import { oneLine } from 'common-tags';
import { z } from 'zod';

const fluxResponseSchema = z.union([z.object({ result: z.object({ image: z.string() }) }), z.object({ image: z.string() })]);

export const aiImageMetadataSchema = z.object({
	id: z.string(),
	name: z.string(),
	prompt: z.string(),
	createdAt: z.string(),
});

export type AIImageMetadata = z.infer<typeof aiImageMetadataSchema>;

export interface GeneratedBackgroundImage extends AIImageMetadata {
	path: string;
}

export async function generateAndStoreBackgroundImage(prompt: string, userId: string): Promise<GeneratedBackgroundImage> {
	const augmentedPrompt = oneLine`
		${prompt}, vibrant digital art style, energetic and fun atmosphere, wide panoramic composition,
		colorful, soft lighting, frame composition with richer detail toward edges and fewer busy elements in the center,
		no people, no characters, scenery only,
		8k resolution, high definition, aesthetically pleasing background
	`;

	const form = new FormData();
	form.append('prompt', augmentedPrompt);
	form.append('steps', '15');
	form.append('width', '2048');
	form.append('height', '1024');

	const formRequest = new Request('http://dummy', {
		method: 'POST',
		body: form,
	});

	// @ts-expect-error model types not available
	const response = await env.AI.run('@cf/black-forest-labs/flux-2-klein-9b', {
		multipart: {
			body: formRequest.body,
			contentType: formRequest.headers.get('content-type') || 'multipart/form-data',
		},
	});

	const parsedResponse = fluxResponseSchema.safeParse(response);
	if (!parsedResponse.success) {
		throw new Error('Invalid response from the image generation model');
	}

	const data = parsedResponse.data;
	const image = 'result' in data ? data.result.image : data.image;
	if (!image) {
		throw new Error('No image returned from the image generation model');
	}

	const imageId = crypto.randomUUID();
	const imagePath = `/api/images/${userId}/${imageId}`;
	const binaryString = atob(image);
	const bytes = new Uint8Array(binaryString.length);
	for (let index = 0; index < binaryString.length; index++) {
		bytes[index] = binaryString.codePointAt(index) ?? 0;
	}

	const metadata: AIImageMetadata = {
		id: imageId,
		name: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
		prompt,
		createdAt: new Date().toISOString(),
	};

	await env.KV_IMAGES.put(`user:${userId}:image:${imageId}`, bytes, { metadata });

	return { path: imagePath, ...metadata };
}

export async function deleteGeneratedBackgroundImage(userId: string, imageId: string): Promise<void> {
	await env.KV_IMAGES.delete(`user:${userId}:image:${imageId}`);
}
