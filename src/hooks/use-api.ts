import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono/client';

import { hcWithType, type Client } from '@/lib/clients/api-client';
import { apiQuizSchema } from '@shared/validation';

const client: Client = hcWithType('/');

// Query Keys
export const queryKeys = {
	quizzes: {
		all: ['quizzes'] as const,
		predefined: () => [...queryKeys.quizzes.all, 'predefined'] as const,
		custom: (userId: string) => [...queryKeys.quizzes.all, 'custom', userId] as const,
		detail: (userId: string, id: string) => [...queryKeys.quizzes.custom(userId), id] as const,
	},
	images: {
		all: (userId: string) => ['images', userId] as const,
	},
};

// ============ Quizzes ============

export function usePredefinedQuizzes() {
	return useQuery({
		queryKey: queryKeys.quizzes.predefined(),
		queryFn: async () => {
			const response = await client.api.quizzes.$get();
			const result = await response.json();
			if (!result.success) throw new Error('error' in result ? String(result.error) : 'Failed to fetch quizzes');
			return apiQuizSchema.array().parse(result.data);
		},
	});
}

export function useCustomQuizzes(userId: string) {
	return useQuery({
		queryKey: queryKeys.quizzes.custom(userId),
		queryFn: async () => {
			const response = await client.api.quizzes.custom.$get({ header: { 'x-user-id': userId } });
			const result = await response.json();
			if (!result.success) throw new Error('error' in result ? String(result.error) : 'Failed to fetch custom quizzes');
			return apiQuizSchema.array().parse(result.data);
		},
	});
}

export function useQuizDetail(userId: string, quizId: string | undefined) {
	return useQuery({
		queryKey: queryKeys.quizzes.detail(userId, quizId ?? ''),
		queryFn: async () => {
			const response = await client.api.quizzes.custom[':id'].$get({ header: { 'x-user-id': userId }, param: { id: quizId! } });
			const result = await response.json();
			if (!result.success) throw new Error('error' in result ? String(result.error) : 'Failed to fetch quiz');
			return result.data;
		},
		enabled: !!quizId,
	});
}

type CreateGameRequest = InferRequestType<typeof client.api.games.$post>;
type CreateGameResponse = InferResponseType<typeof client.api.games.$post>;

export function useCreateGame() {
	return useMutation<CreateGameResponse, Error, CreateGameRequest>({
		mutationFn: async (request) => {
			const response = await client.api.games.$post(request);
			return await response.json();
		},
	});
}

type CreateQuizRequest = InferRequestType<typeof client.api.quizzes.custom.$post>;

export function useCreateQuiz() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (request: CreateQuizRequest) => {
			const response = await client.api.quizzes.custom.$post(request);
			const result = await response.json();
			if (!result.success) throw new Error('error' in result ? String(result.error) : 'Failed to create quiz');
			return result.data;
		},
		onSuccess: (_, variables) => {
			const userId = variables.header['x-user-id'];
			void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.custom(userId) });
		},
	});
}

type UpdateQuizRequest = InferRequestType<(typeof client.api.quizzes.custom)[':id']['$put']>;

export function useUpdateQuiz() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (request: UpdateQuizRequest) => {
			const response = await client.api.quizzes.custom[':id'].$put(request);
			const result = await response.json();
			if (!result.success) throw new Error('error' in result ? result.error : 'Failed to update quiz');
			return result.data;
		},
		onSuccess: (_, variables) => {
			const userId = variables.header['x-user-id'];
			void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.custom(userId) });
		},
	});
}

export function useDeleteQuiz() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ userId, quizId }: { userId: string; quizId: string }) => {
			const response = await client.api.quizzes.custom[':id'].$delete({ header: { 'x-user-id': userId }, param: { id: quizId } });
			if (!response.ok) throw new Error('Failed to delete quiz');
			return quizId;
		},
		onSuccess: (_, { userId }) => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.custom(userId) });
		},
	});
}

type GenerateQuestionRequest = InferRequestType<(typeof client.api.quizzes)['generate-question']['$post']>;

export function useGenerateQuestion() {
	return useMutation({
		mutationFn: async (request: GenerateQuestionRequest) => {
			const response = await client.api.quizzes['generate-question'].$post(request);
			const result = await response.json();
			if (!response.ok || !result.success || !result.data) {
				throw new Error('error' in result ? result.error : 'Failed to generate question');
			}
			return result.data;
		},
	});
}

// ============ Images ============

export function useImages(userId: string) {
	return useQuery({
		queryKey: queryKeys.images.all(userId),
		queryFn: async () => {
			const response = await client.api.images.$get({ header: { 'x-user-id': userId }, query: {} });
			if (!response.ok) throw new Error('Failed to fetch images');
			const result = await response.json();
			if (!result.success) throw new Error('error' in result ? String(result.error) : 'Failed to fetch images');
			return result.data;
		},
	});
}

export function useLoadMoreImages() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ userId, cursor }: { userId: string; cursor: string }) => {
			const response = await client.api.images.$get({ header: { 'x-user-id': userId }, query: { cursor } });
			if (!response.ok) throw new Error('Failed to load more images');
			const result = await response.json();
			if (!result.success || !result.data) throw new Error('error' in result ? String(result.error) : 'Failed to load images');
			return result.data;
		},
		onSuccess: (data, { userId }) => {
			queryClient.setQueryData(queryKeys.images.all(userId), (old: typeof data | undefined) => {
				if (!old) return data;
				return {
					images: [...old.images, ...data.images],
					nextCursor: data.nextCursor,
				};
			});
		},
	});
}

type GenerateImageRequest = InferRequestType<typeof client.api.images.generate.$post>;

export function useGenerateImage() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (request: GenerateImageRequest) => {
			const response = await client.api.images.generate.$post(request);
			const result = await response.json();
			if (!response.ok || !result.success || !result.data) {
				throw new Error('error' in result ? result.error : 'Failed to generate image');
			}
			return result.data;
		},
		onSuccess: (data, variables) => {
			const userId = variables.header['x-user-id'];
			queryClient.setQueryData(queryKeys.images.all(userId), (old: { images: (typeof data)[]; nextCursor?: string } | undefined) => {
				if (!old) return { images: [data], nextCursor: undefined };
				return { ...old, images: [data, ...old.images] };
			});
		},
	});
}

export function useDeleteImage() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ userId, imageId }: { userId: string; imageId: string }) => {
			const response = await client.api.images[':userId'][':imageId'].$delete({
				header: { 'x-user-id': userId },
				param: { userId, imageId },
			});
			const result = await response.json();
			if (!response.ok || !result.success) {
				throw new Error('error' in result ? result.error : 'Failed to delete image');
			}
			return imageId;
		},
		onSuccess: (imageId, { userId }) => {
			queryClient.setQueryData(queryKeys.images.all(userId), (old: { images: { id: string }[]; nextCursor?: string } | undefined) => {
				if (!old) return old;
				return { ...old, images: old.images.filter((img) => img.id !== imageId) };
			});
		},
	});
}

// ============ Sync ============

type GenerateSyncCodeRequest = InferRequestType<typeof client.api.sync.generate.$post>;

export function useGenerateSyncCode() {
	return useMutation({
		mutationFn: async (request: GenerateSyncCodeRequest) => {
			const response = await client.api.sync.generate.$post(request);
			const result = await response.json();
			if (!result.success || !result.data) {
				throw new Error('error' in result ? result.error : 'Failed to generate sync code');
			}
			return result.data;
		},
	});
}

type RedeemSyncCodeRequest = InferRequestType<typeof client.api.sync.redeem.$post>;

export function useRedeemSyncCode() {
	return useMutation({
		mutationFn: async (request: RedeemSyncCodeRequest) => {
			const response = await client.api.sync.redeem.$post(request);
			const result = await response.json();
			if (!result.success || !result.data) {
				throw new Error('error' in result ? result.error : 'Invalid or expired sync code');
			}
			return result.data;
		},
	});
}
