import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorCode } from '@shared/errors';
import type { GamePhase } from '@shared/types';
import { phaseAllowsEmoji } from '@shared/phase-rules';
import { useGameStore } from '@/lib/game-store';
import { useGameWebSocket } from '@/hooks/use-game-web-socket';
import { PlayerNicknameForm } from '@/components/game/player/player-nickname-form';
import { PlayerAnswerScreen } from '@/components/game/player/player-answer-screen';
import { PlayerWaitingScreen } from '@/components/game/player/player-waiting-screen';
import { JoinGameDialog } from '@/components/game/player/join-game-dialog';
import { EmojiPicker } from '@/components/game/shared';
import { useSound } from '@/hooks/use-sound';
import { AnimatedNumber } from '@/components/ui/animated-number';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type View = 'LOADING' | 'JOIN_GAME' | 'NICKNAME' | 'GAME' | 'GAME_IN_PROGRESS' | 'ROOM_NOT_FOUND' | 'SESSION_EXPIRED' | 'GAME_FULL';

const phaseIsActiveForPlayer: Record<GamePhase, boolean> = {
	LOBBY: false,
	GET_READY: true,
	QUESTION_MODIFIER: true,
	QUESTION: true,
	REVEAL: true,
	LEADERBOARD: true,
	END_INTRO: false,
	END_REVEALED: false,
};

export function PlayerPage() {
	const navigate = useNavigate();
	const [searchParameters] = useSearchParams();
	const urlGameId = searchParameters.get('gameId');

	// Zustand state for session persistence
	const sessionGameId = useGameStore((s) => s.gameId);
	const storedPlayerId = useGameStore((s) => s.playerId);
	const storedPlayerToken = useGameStore((s) => s.playerToken);
	const nickname = useGameStore((s) => s.nickname);
	const setSession = useGameStore((s) => s.setSession);
	const clearSession = useGameStore((s) => s.clearSession);

	// Derive initial state based on URL and stored session
	const isReconnecting = !!(urlGameId && storedPlayerId && storedPlayerToken && sessionGameId === urlGameId);
	const isDifferentGame = !!(urlGameId && storedPlayerId && sessionGameId && sessionGameId !== urlGameId);

	const [view, setView] = useState<View>(() => {
		if (!urlGameId) return 'JOIN_GAME';
		if (isReconnecting) return 'GAME';
		return 'LOADING';
	});
	const [currentPlayerId, setCurrentPlayerId] = useState<string | undefined>(() =>
		isReconnecting ? (storedPlayerId ?? undefined) : undefined,
	);
	const [currentPlayerToken, setCurrentPlayerToken] = useState<string | undefined>(() =>
		isReconnecting ? (storedPlayerToken ?? undefined) : undefined,
	);
	const [currentNickname, setCurrentNickname] = useState<string>(() => (isReconnecting ? (nickname ?? '') : ''));
	const pendingNicknameReference = useRef<string>(isReconnecting ? (nickname ?? '') : '');
	// Track which question index we've processed side effects for (sound, score update)
	const processedRevealReference = useRef<number | undefined>(undefined);
	// For reconnecting players, initialize score as null until synced from leaderboard
	// For new players, start at 0
	const [totalScore, setTotalScore] = useState<number | undefined>(() => (storedPlayerId ? undefined : 0));
	// Track if we've done the initial score sync for reconnecting players
	const [hasInitialScoreSync, setHasInitialScoreSync] = useState(!storedPlayerId);
	const { playSound } = useSound();

	// Clear old session if joining a different game (side effect only, no state updates)
	useEffect(() => {
		if (isDifferentGame) {
			clearSession();
		}
	}, [isDifferentGame, clearSession]);

	const handleConnected = useCallback(
		(playerId?: string, playerToken?: string) => {
			if (playerId && playerToken && urlGameId) {
				setCurrentPlayerId(playerId);
				setCurrentPlayerToken(playerToken);
				// Update session with server-assigned playerId and secure token
				// Use ref to get the latest nickname (avoids race condition with state)
				const nicknameToSave = pendingNicknameReference.current;
				if (nicknameToSave) {
					setSession({ gameId: urlGameId, playerId, playerToken, nickname: nicknameToSave });
				}
				setView('GAME');
			} else if (!playerId) {
				// No playerId returned - either new player or reconnect failed
				if (storedPlayerId) {
					// We tried to reconnect with a stored playerId but server didn't recognize us
					// Clear the invalid session - user will need to rejoin
					clearSession();
					setCurrentPlayerId(undefined);
					setCurrentPlayerToken(undefined);
					pendingNicknameReference.current = '';
					setCurrentNickname('');
				}
				// Game exists, show nickname form (handleError will override to GAME_IN_PROGRESS if game started)
				setView('NICKNAME');
			}
		},
		[urlGameId, setSession, storedPlayerId, clearSession],
	);

	const handleError = useCallback(
		(code: string, message: string) => {
			switch (code) {
				case ErrorCode.GAME_ALREADY_STARTED: {
					setView('GAME_IN_PROGRESS');
					break;
				}
				case ErrorCode.GAME_NOT_FOUND: {
					setView('ROOM_NOT_FOUND');
					break;
				}
				case ErrorCode.INVALID_SESSION_TOKEN: {
					// Session token was invalid or missing - clear session and show friendly message
					clearSession();
					setCurrentPlayerId(undefined);
					setCurrentPlayerToken(undefined);
					pendingNicknameReference.current = '';
					setCurrentNickname('');
					setView('SESSION_EXPIRED');
					break;
				}
				case ErrorCode.GAME_FULL: {
					setView('GAME_FULL');
					break;
				}
				default: {
					toast.error(message);
				}
			}
		},
		[clearSession],
	);

	const { isConnecting, isConnected, error, gameState, submittedAnswer, join, submitAnswer, sendEmoji } = useGameWebSocket({
		gameId: urlGameId!,
		role: 'player',
		playerId: currentPlayerId,
		playerToken: currentPlayerToken,
		onError: handleError,
		onConnected: handleConnected,
	});

	// Derive answerResult from gameState.playerResult (no state needed)
	// playerResult persists until next question starts, so this works for REVEAL and LEADERBOARD phases
	const answerResult = gameState.playerResult
		? { isCorrect: gameState.playerResult.isCorrect, score: gameState.playerResult.score }
		: undefined;

	// Handle reveal side effects (sound, score update) - only once per question
	useEffect(() => {
		// Reset processed reveal ref when a new question starts
		if (gameState.phase === 'QUESTION') {
			processedRevealReference.current = undefined;
			return;
		}

		if (gameState.phase === 'REVEAL' && gameState.playerResult && processedRevealReference.current !== gameState.questionIndex) {
			processedRevealReference.current = gameState.questionIndex;
			const scoreToAdd = gameState.playerResult.score;
			const isCorrect = gameState.playerResult.isCorrect;
			// Defer setState to avoid synchronous cascading render
			requestAnimationFrame(() => {
				setTotalScore((previous) => (previous ?? 0) + scoreToAdd);
			});
			playSound(isCorrect ? 'correct' : 'incorrect');
		}
	}, [gameState.phase, gameState.playerResult, gameState.questionIndex, playSound]);

	// Sync total score with leaderboard when available (handles reconnection - one time only)
	useEffect(() => {
		if (!hasInitialScoreSync && gameState.leaderboard.length > 0 && currentPlayerId) {
			const myLeaderboardScore = gameState.leaderboard.find((p) => p.id === currentPlayerId)?.score;
			if (myLeaderboardScore !== undefined) {
				// Defer setState to avoid synchronous cascading render
				requestAnimationFrame(() => {
					setTotalScore(myLeaderboardScore);
				});
				// Mark sync as done after a short delay to skip initial animation
				setTimeout(() => setHasInitialScoreSync(true), 100);
			}
		}
	}, [gameState.leaderboard, currentPlayerId, hasInitialScoreSync]);

	// Block navigation when game is active (not in LOBBY or END)
	const isGameActive = view === 'GAME' && isConnected && phaseIsActiveForPlayer[gameState.phase];
	const blocker = useBlocker(isGameActive);

	// Warn before browser/tab close when game is active
	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (isGameActive) {
				event.preventDefault();
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [isGameActive]);

	const handleJoin = useCallback(
		(name: string) => {
			if (!name.trim() || !urlGameId) return;
			pendingNicknameReference.current = name; // Update ref immediately
			setCurrentNickname(name);
			join(name);
			toast.success(`Welcome, ${name}!`);
			playSound('join');
			// Session will be saved in handleConnected when server confirms with playerId
		},
		[urlGameId, join, playSound],
	);

	const handleAnswer = useCallback(
		(answerIndex: number) => {
			submitAnswer(answerIndex);
		},
		[submitAnswer],
	);

	if (view === 'JOIN_GAME') {
		return <JoinGameDialog />;
	}

	if (view === 'LOADING' || (view === 'GAME' && isConnecting && !isConnected)) {
		return (
			<div
				className={`
					flex min-h-screen w-full items-center justify-center bg-slate-800
				`}
			>
				<Loader2 className="size-16 animate-spin text-white" />
			</div>
		);
	}

	if (view === 'NICKNAME') {
		return (
			<>
				<PlayerNicknameForm onJoin={handleJoin} isLoading={isConnecting} />
				<Toaster richColors />
			</>
		);
	}

	if (view === 'GAME_IN_PROGRESS') {
		return (
			<div
				className={`
					flex min-h-screen w-full flex-col items-center justify-center bg-slate-800
					p-8 text-white
				`}
			>
				<div className="mb-6 text-6xl">🎮</div>
				<h1 className="mb-4 text-center text-3xl font-bold">Game Already In Progress</h1>
				<p className="mb-8 max-w-md text-center text-lg text-slate-300">
					Sorry, this game has already started. You can wait for the next round or join a different game.
				</p>
				<button
					onClick={() => navigate('/')}
					className={`
						rounded-lg bg-indigo-600 px-6 py-3 font-semibold transition-colors
						hover:bg-indigo-700
					`}
				>
					Back to Home
				</button>
			</div>
		);
	}

	if (view === 'ROOM_NOT_FOUND') {
		return (
			<div
				className={`
					flex min-h-screen w-full flex-col items-center justify-center bg-slate-800
					p-8 text-white
				`}
			>
				<div className="mb-6 text-6xl">🔍</div>
				<h1 className="mb-4 text-center text-3xl font-bold">Game Not Found</h1>
				<p className="mb-8 max-w-md text-center text-lg text-slate-300">
					We couldn't find a game with that code. It may have ended or the link might be incorrect.
				</p>
				<button
					onClick={() => navigate('/')}
					className={`
						rounded-lg bg-indigo-600 px-6 py-3 font-semibold transition-colors
						hover:bg-indigo-700
					`}
				>
					Back to Home
				</button>
			</div>
		);
	}

	if (view === 'SESSION_EXPIRED') {
		return (
			<div
				className={`
					flex min-h-screen w-full flex-col items-center justify-center bg-slate-800
					p-8 text-white
				`}
			>
				<div className="mb-6 text-6xl">🔑</div>
				<h1 className="mb-4 text-center text-3xl font-bold">Session Expired</h1>
				<p className="mb-8 max-w-md text-center text-lg text-slate-300">
					Your session could not be restored. This can happen if you cleared your browser data or if too much time has passed. Please rejoin
					the game with a new nickname.
				</p>
				<div className="flex gap-4">
					<button
						onClick={() => setView('NICKNAME')}
						className={`
							rounded-lg bg-indigo-600 px-6 py-3 font-semibold transition-colors
							hover:bg-indigo-700
						`}
					>
						Rejoin Game
					</button>
					<button
						onClick={() => navigate('/')}
						className={`
							rounded-lg bg-slate-600 px-6 py-3 font-semibold transition-colors
							hover:bg-slate-700
						`}
					>
						Back to Home
					</button>
				</div>
			</div>
		);
	}

	if (view === 'GAME_FULL') {
		return (
			<div
				className={`
					flex min-h-screen w-full flex-col items-center justify-center bg-slate-800
					p-8 text-white
				`}
			>
				<div className="mb-6 text-6xl">👥</div>
				<h1 className="mb-4 text-center text-3xl font-bold">Game is Full</h1>
				<p className="mb-8 max-w-md text-center text-lg text-slate-300">
					Sorry, this game has reached the maximum of 100 players. Please try joining a different game or wait for the next round.
				</p>
				<button
					onClick={() => navigate('/')}
					className={`
						rounded-lg bg-indigo-600 px-6 py-3 font-semibold transition-colors
						hover:bg-indigo-700
					`}
				>
					Back to Home
				</button>
			</div>
		);
	}

	// Use tracked total score (updates on reveal, syncs with leaderboard when available)
	const myScore = totalScore;

	const renderGameContent = () => {
		if (error && !isConnected) return <div className="text-red-300">{error}</div>;

		// Show answer buttons only during QUESTION phase (not GET_READY)
		if (gameState.phase === 'QUESTION' && gameState.options.length > 0) {
			const optionIndices = Array.from({ length: gameState.options.length }, (_, index) => index);
			return <PlayerAnswerScreen onAnswer={handleAnswer} submittedAnswer={submittedAnswer} optionIndices={optionIndices} />;
		}

		// Show waiting screen for all other phases including GET_READY and QUESTION_MODIFIER
		return (
			<PlayerWaitingScreen
				phase={gameState.phase}
				answerResult={answerResult}
				finalScore={myScore}
				playerId={currentPlayerId}
				leaderboard={gameState.leaderboard}
				modifiers={gameState.modifiers}
			/>
		);
	};

	return (
		<div className="flex min-h-screen w-full flex-col bg-slate-800 p-4 text-white">
			<header className="flex items-center justify-between text-2xl font-bold">
				<span>{currentNickname}</span>
				<span>
					Score: <AnimatedNumber value={myScore ?? 0} instant={!hasInitialScoreSync} />
				</span>
			</header>
			<main className="flex grow items-center justify-center">
				<AnimatePresence mode="wait">{renderGameContent()}</AnimatePresence>
			</main>

			<AnimatePresence>
				{phaseAllowsEmoji[gameState.phase] && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
						className="fixed inset-x-0 bottom-0 z-30 pb-4"
					>
						<EmojiPicker onEmojiSelect={sendEmoji} />
					</motion.div>
				)}
			</AnimatePresence>

			<Toaster richColors theme="dark" />

			{/* Leave game confirmation dialog */}
			<AlertDialog open={blocker.state === 'blocked'} preventBackClose>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Leave Game?</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to leave the game?</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => blocker.reset?.()}>Stay in Game</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => blocker.proceed?.()}
							className={`
								bg-red-500
								hover:bg-red-600
							`}
						>
							Leave Game
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
