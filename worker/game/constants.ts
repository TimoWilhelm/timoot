/** Time limit for answering each question (20 seconds) */
export const QUESTION_TIME_LIMIT_MS = 20_000;

/** Delay before advancing to reveal when all players have answered (1.5 seconds) */
export const ALL_ANSWERED_DELAY_MS = 1_500;

/** Countdown duration for GET_READY phase before first question (6 seconds) */
export const GET_READY_COUNTDOWN_MS = 6_000;

/** Duration for QUESTION_MODIFIER phase animation (2.5 seconds) */
export const QUESTION_MODIFIER_DURATION_MS = 2_500;

/** Cleanup delay after game ends or all disconnect (5 minutes) */
export const CLEANUP_DELAY_MS = 5 * 60 * 1_000;

/** Maximum number of players per game */
export const MAX_PLAYERS = 100;
