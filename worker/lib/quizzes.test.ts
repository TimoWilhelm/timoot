import { describe, expect, it } from 'vitest';

import { GENERAL_KNOWLEDGE_QUIZ, PREDEFINED_QUIZZES } from './quizzes';

describe('quizzes.ts', () => {
	describe('PREDEFINED_QUIZZES', () => {
		it('is a non-empty array', () => {
			expect(Array.isArray(PREDEFINED_QUIZZES)).toBe(true);
			expect(PREDEFINED_QUIZZES.length).toBeGreaterThan(0);
		});

		it('all quizzes have required properties', () => {
			for (const quiz of PREDEFINED_QUIZZES) {
				expect(quiz).toHaveProperty('id');
				expect(quiz).toHaveProperty('title');
				expect(quiz).toHaveProperty('questions');
				expect(typeof quiz.id).toBe('string');
				expect(typeof quiz.title).toBe('string');
				expect(Array.isArray(quiz.questions)).toBe(true);
			}
		});

		it('all quizzes have unique IDs', () => {
			const ids = PREDEFINED_QUIZZES.map((q) => q.id);
			const uniqueIds = [...new Set(ids)];
			expect(ids.length).toBe(uniqueIds.length);
		});

		it('all quizzes have at least one question', () => {
			for (const quiz of PREDEFINED_QUIZZES) {
				expect(quiz.questions.length).toBeGreaterThan(0);
			}
		});

		it('all quizzes have type "predefined"', () => {
			for (const quiz of PREDEFINED_QUIZZES) {
				expect(quiz.type).toBe('predefined');
			}
		});
	});

	describe('Question validation', () => {
		const allQuestions = PREDEFINED_QUIZZES.flatMap((q) => q.questions);

		it('all questions have required properties', () => {
			for (const question of allQuestions) {
				expect(question).toHaveProperty('text');
				expect(question).toHaveProperty('options');
				expect(question).toHaveProperty('correctAnswerIndex');
				expect(typeof question.text).toBe('string');
				expect(Array.isArray(question.options)).toBe(true);
				expect(typeof question.correctAnswerIndex).toBe('number');
			}
		});

		it('all questions have non-empty text', () => {
			for (const question of allQuestions) {
				expect(question.text.trim().length).toBeGreaterThan(0);
			}
		});

		it('all questions have at least 2 options', () => {
			for (const question of allQuestions) {
				expect(question.options.length).toBeGreaterThanOrEqual(2);
			}
		});

		it('all options are non-empty strings', () => {
			for (const question of allQuestions) {
				for (const option of question.options) {
					expect(typeof option).toBe('string');
					expect(option.trim().length).toBeGreaterThan(0);
				}
			}
		});

		it('all correctAnswerIndex values are within bounds', () => {
			for (const question of allQuestions) {
				expect(question.correctAnswerIndex).toBeGreaterThanOrEqual(0);
				expect(question.correctAnswerIndex).toBeLessThan(question.options.length);
			}
		});

		it('isDoublePoints is boolean or undefined', () => {
			for (const question of allQuestions) {
				if (question.isDoublePoints !== undefined) {
					expect(typeof question.isDoublePoints).toBe('boolean');
				}
			}
		});
	});

	describe('GENERAL_KNOWLEDGE_QUIZ', () => {
		it('is exported and non-empty', () => {
			expect(Array.isArray(GENERAL_KNOWLEDGE_QUIZ)).toBe(true);
			expect(GENERAL_KNOWLEDGE_QUIZ.length).toBeGreaterThan(0);
		});

		it('is used in predefined quizzes', () => {
			const generalQuiz = PREDEFINED_QUIZZES.find((q) => q.id === 'general');
			expect(generalQuiz).toBeDefined();
			expect(generalQuiz?.questions).toBe(GENERAL_KNOWLEDGE_QUIZ);
		});
	});

	describe('Specific quiz content', () => {
		it('contains General Knowledge quiz', () => {
			const general = PREDEFINED_QUIZZES.find((q) => q.id === 'general');
			expect(general).toBeDefined();
			expect(general?.title).toBe('General Knowledge');
		});

		it('contains Tech Trivia quiz', () => {
			const tech = PREDEFINED_QUIZZES.find((q) => q.id === 'tech');
			expect(tech).toBeDefined();
			expect(tech?.title).toBe('Tech Trivia');
		});

		it('contains World Geography quiz', () => {
			const geo = PREDEFINED_QUIZZES.find((q) => q.id === 'geo');
			expect(geo).toBeDefined();
			expect(geo?.title).toBe('World Geography');
		});
	});
});
