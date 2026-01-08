import { describe, it, expect } from 'vitest';

import { queryKeys } from './use-api';

// Test the queryKeys structure and factory functions
describe('use-api.ts', () => {
	describe('queryKeys', () => {
		describe('quizzes', () => {
			it('has correct base key', () => {
				expect(queryKeys.quizzes.all).toEqual(['quizzes']);
			});

			it('generates predefined quiz key', () => {
				const key = queryKeys.quizzes.predefined();
				expect(key).toEqual(['quizzes', 'predefined']);
			});

			it('generates custom quiz key with userId', () => {
				const key = queryKeys.quizzes.custom('user-123');
				expect(key).toEqual(['quizzes', 'custom', 'user-123']);
			});

			it('generates detail key with userId and quizId', () => {
				const key = queryKeys.quizzes.detail('user-123', 'quiz-456');
				expect(key).toEqual(['quizzes', 'custom', 'user-123', 'quiz-456']);
			});

			it('different users have different keys', () => {
				const key1 = queryKeys.quizzes.custom('user-1');
				const key2 = queryKeys.quizzes.custom('user-2');
				expect(key1).not.toEqual(key2);
			});
		});

		describe('images', () => {
			it('generates images key with userId', () => {
				const key = queryKeys.images.all('user-123');
				expect(key).toEqual(['images', 'user-123']);
			});

			it('different users have different image keys', () => {
				const key1 = queryKeys.images.all('user-1');
				const key2 = queryKeys.images.all('user-2');
				expect(key1).not.toEqual(key2);
			});
		});

		describe('key isolation', () => {
			it('quiz and image keys are in different namespaces', () => {
				const quizKey = queryKeys.quizzes.custom('user-1');
				const imageKey = queryKeys.images.all('user-1');

				expect(quizKey[0]).toBe('quizzes');
				expect(imageKey[0]).toBe('images');
				expect(quizKey[0]).not.toBe(imageKey[0]);
			});
		});
	});
});

// Note: Hook function tests would require React Testing Library wrapper
// and mocking of the client. The queryKeys tests above verify the caching
// key structure which is critical for correct React Query behavior.
