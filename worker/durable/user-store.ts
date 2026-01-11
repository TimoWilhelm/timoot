import { DurableObject } from 'cloudflare:workers';

import type { Quiz } from '@shared/types';

// 6 months in milliseconds for data expiration
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

/**
 * UserStoreDurableObject - Per-user DO for storing custom quizzes
 * Accessed via idFromName('user:{userId}') for user isolation
 * Data expires after 6 months of inactivity
 */
export class UserStoreDurableObject extends DurableObject<Env> {
	/**
	 * Update last access timestamp and schedule cleanup alarm
	 * Called on every user interaction to reset the 6-month expiration
	 * @param userId - The user ID to store for KV cleanup
	 */
	async touchLastAccess(userId: string): Promise<void> {
		await this.ctx.storage.put('last_access', Date.now());
		await this.ctx.storage.put('user_id', userId);
		// Schedule alarm for 6 months from now
		await this.ctx.storage.setAlarm(Date.now() + SIX_MONTHS_MS);
	}

	/**
	 * Alarm handler - cleans up all user data (quizzes + images) if no activity in 6 months
	 */
	async alarm(): Promise<void> {
		const lastAccess = await this.ctx.storage.get<number>('last_access');
		const now = Date.now();

		// If no activity in 6 months, delete all data
		if (!lastAccess || now - lastAccess >= SIX_MONTHS_MS) {
			const userId = await this.ctx.storage.get<string>('user_id');
			console.log(`[UserStore] Cleaning up inactive user data for user: ${userId || 'unknown'}`);

			// Clean up KV images for this user
			if (userId) {
				await this.cleanupUserImages(userId);
			}

			// Delete all DO storage (quizzes, last_access, user_id)
			await this.ctx.storage.deleteAll();
		} else {
			// User was active, reschedule alarm for remaining time
			const remainingTime = SIX_MONTHS_MS - (now - lastAccess);
			await this.ctx.storage.setAlarm(now + remainingTime);
		}
	}

	/**
	 * Delete all KV images for a user
	 */
	private async cleanupUserImages(userId: string): Promise<void> {
		const prefix = `user:${userId}:image:`;
		let cursor: string | undefined;

		do {
			const listResult = await this.env.KV_IMAGES.list({ prefix, cursor });

			// Delete all images in this batch
			await Promise.all(listResult.keys.map((key) => this.env.KV_IMAGES.delete(key.name)));

			cursor = listResult.list_complete ? undefined : listResult.cursor;
		} while (cursor);
	}

	async getCustomQuizzes(): Promise<Quiz[]> {
		return (await this.ctx.storage.get<Quiz[]>('custom_quizzes')) || [];
	}

	async getCustomQuizById(id: string): Promise<Quiz | undefined> {
		const quizzes = await this.getCustomQuizzes();
		return quizzes.find((q) => q.id === id);
	}

	async saveCustomQuiz(quizData: Omit<Quiz, 'id'> & { id?: string }): Promise<Quiz> {
		const quizzes = await this.getCustomQuizzes();

		if (quizData.id) {
			const index = quizzes.findIndex((q) => q.id === quizData.id);
			if (index !== -1) {
				// Update existing quiz
				quizzes[index] = { ...quizzes[index], ...quizData, id: quizData.id };
				await this.ctx.storage.put('custom_quizzes', quizzes);
				return quizzes[index];
			}
		}

		// Create new quiz
		const newQuiz: Quiz = { ...quizData, id: quizData.id || crypto.randomUUID() };
		quizzes.push(newQuiz);
		await this.ctx.storage.put('custom_quizzes', quizzes);
		return newQuiz;
	}

	async deleteCustomQuiz(id: string): Promise<{ success: boolean }> {
		const quizzes = await this.getCustomQuizzes();
		const initialLength = quizzes.length;
		const filtered = quizzes.filter((q) => q.id !== id);

		if (filtered.length < initialLength) {
			await this.ctx.storage.put('custom_quizzes', filtered);
			return { success: true };
		}
		return { success: false };
	}
}
