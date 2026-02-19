/** Time limit for answering each question */
export const QUESTION_TIME_LIMIT_MS = 20_000;

/** Safety buffer added to the question time limit for the server-side timeout alarm.
 * This ensures the server alarm fires after the host client timer, acting as a fallback
 * in case the host disconnects or the client timer fails. */
export const QUESTION_TIMEOUT_BUFFER_MS = 3000;

/** Delay before advancing to reveal when all players have answered */
export const ALL_ANSWERED_DELAY_MS = 1500;

/** Duration for QUESTION_MODIFIER phase animation */
export const QUESTION_MODIFIER_DURATION_MS = 2500;

/** Cleanup delay after game ends or all disconnect */
export const CLEANUP_DELAY_MS = 5 * 60 * 1000;

/** Delay before revealing final standings in END phase */
export const END_REVEAL_DELAY_MS = 3000;

/** Maximum number of players per game */
export const MAX_PLAYERS = 100;
