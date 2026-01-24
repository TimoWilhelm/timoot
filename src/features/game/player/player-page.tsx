import { Loader2 } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useBlocker, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/alert-dialog';
import { Button } from '@/components/button';
import { useGameWebSocket } from '@/features/game/hooks/use-game-web-socket';
import { PlayerError } from '@/features/game/player/player-error';
import { PlayerGameProvider } from '@/features/game/player/player-game-provider';
import { PlayerJoinGame } from '@/features/game/player/player-join-game';
import { PlayerNickname } from '@/features/game/player/player-nickname';
import { PlayerPageLayout } from '@/features/game/player/player-page-layout';
import { useSound } from '@/hooks/sound/use-sound';
import { useViewTransitionNavigate } from '@/hooks/ui/use-view-transition-navigate';
import { useGameStore } from '@/lib/stores/game-store';
import { ErrorCode } from '@shared/errors';
import { createMachine } from '@shared/fsm';
import { isGamePhaseActive } from '@shared/phase-rules';

// Lazy load the heavy game component
const PlayerActiveGame = lazy(() => import('@/features/game/player/player-active-game').then((m) => ({ default: m.PlayerActiveGame })));

// Player view state machine
type PlayerView = 'LOADING' | 'JOIN_GAME' | 'NICKNAME' | 'GAME' | 'GAME_IN_PROGRESS' | 'ROOM_NOT_FOUND' | 'SESSION_EXPIRED' | 'GAME_FULL';
type PlayerViewEvent =
	| 'CONNECTED'
	| 'JOINED'
	| 'GAME_STARTED'
	| 'GAME_NOT_FOUND'
	| 'SESSION_INVALID'
	| 'GAME_FULL'
	| 'RETRY'
	| 'GAME_CODE_ENTERED';

const playerViewMachine = createMachine<PlayerView, PlayerViewEvent>({
	LOADING: {
		CONNECTED: 'NICKNAME',
		JOINED: 'GAME',
		GAME_STARTED: 'GAME_IN_PROGRESS',
		GAME_NOT_FOUND: 'ROOM_NOT_FOUND',
		SESSION_INVALID: 'SESSION_EXPIRED',
		GAME_FULL: 'GAME_FULL',
	},
	JOIN_GAME: { GAME_CODE_ENTERED: 'LOADING' },
	NICKNAME: {
		JOINED: 'GAME',
		GAME_STARTED: 'GAME_IN_PROGRESS',
		GAME_NOT_FOUND: 'ROOM_NOT_FOUND',
		SESSION_INVALID: 'SESSION_EXPIRED',
		GAME_FULL: 'GAME_FULL',
	},
	GAME: {}, // Terminal - game in progress
	GAME_IN_PROGRESS: { RETRY: 'NICKNAME' },
	ROOM_NOT_FOUND: {}, // Terminal - error
	SESSION_EXPIRED: { RETRY: 'NICKNAME' },
	GAME_FULL: {}, // Terminal - error
});

export function PlayerPage() {
	const navigate = useViewTransitionNavigate();
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

	const [view, setView] = useState<PlayerView>(() => {
		if (!urlGameId) return 'JOIN_GAME';
		if (isReconnecting) return 'GAME';
		return 'LOADING';
	});

	// Helper to transition view state using the state machine
	const transitionView = useCallback((event: PlayerViewEvent) => {
		setView((current) => playerViewMachine.transition(current, event));
	}, []);
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

	// Handle navigation from JOIN_GAME to game with a gameId (URL param change)
	useEffect(() => {
		if (view === 'JOIN_GAME' && urlGameId) {
			// User entered a game code - transition to loading
			// eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: syncing view state with URL parameter change
			transitionView('GAME_CODE_ENTERED');
		}
	}, [view, urlGameId, transitionView]);

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
				transitionView('JOINED');
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
				transitionView('CONNECTED');
			}
		},
		[urlGameId, setSession, storedPlayerId, clearSession, transitionView],
	);

	const handleError = useCallback(
		(code: string, message: string) => {
			switch (code) {
				case ErrorCode.GAME_ALREADY_STARTED: {
					transitionView('GAME_STARTED');
					break;
				}
				case ErrorCode.GAME_NOT_FOUND: {
					transitionView('GAME_NOT_FOUND');
					break;
				}
				case ErrorCode.INVALID_SESSION_TOKEN: {
					// Session token was invalid or missing - clear session and show friendly message
					clearSession();
					setCurrentPlayerId(undefined);
					setCurrentPlayerToken(undefined);
					pendingNicknameReference.current = '';
					setCurrentNickname('');
					transitionView('SESSION_INVALID');
					break;
				}
				case ErrorCode.GAME_FULL: {
					transitionView('GAME_FULL');
					break;
				}
				default: {
					toast.error(message);
				}
			}
		},
		[clearSession, transitionView],
	);

	const { connectionState, error, gameState, submittedAnswer, join, submitAnswer, sendEmoji } = useGameWebSocket({
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
	const isGameActive = view === 'GAME' && connectionState === 'connected' && isGamePhaseActive[gameState.phase];
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

	// Use tracked total score (updates on reveal, syncs with leaderboard when available)
	const myScore = totalScore;

	const isSpinnerVisible = view === 'LOADING' || (view === 'GAME' && connectionState === 'connecting');

	const renderContent = () => {
		if (view === 'JOIN_GAME') {
			return <PlayerJoinGame />;
		}

		if (isSpinnerVisible) {
			return (
				<div className="relative flex items-center justify-center">
					<Loader2 className="size-12 animate-spin text-orange" />
				</div>
			);
		}

		if (view === 'NICKNAME') {
			return (
				<>
					<PlayerNickname onJoin={handleJoin} isLoading={connectionState === 'connecting'} />
				</>
			);
		}

		if (view === 'GAME_IN_PROGRESS') {
			return (
				<PlayerError
					emoji="🎮"
					title="Game Already In Progress"
					description="Sorry, this game has already started. You can wait for the next round or join a different game."
				>
					<Button variant="dark-subtle" onClick={() => navigate('/')}>
						Back to Home
					</Button>
				</PlayerError>
			);
		}

		if (view === 'ROOM_NOT_FOUND') {
			return (
				<PlayerError
					emoji="🔍"
					title="Game Not Found"
					description="We couldn't find a game with that code. It may have ended or the link might be incorrect."
				>
					<Button variant="dark-subtle" onClick={() => navigate('/')}>
						Back to Home
					</Button>
				</PlayerError>
			);
		}

		if (view === 'SESSION_EXPIRED') {
			return (
				<PlayerError
					emoji="🔑"
					title="Session Expired"
					description="Your session could not be restored. This can happen if you cleared your browser data or if too much time has passed. Please rejoin the game with a new nickname."
				>
					<div className="flex gap-4">
						<Button variant="dark-accent" onClick={() => setView('NICKNAME')}>
							Rejoin Game
						</Button>
						<Button variant="dark-subtle" onClick={() => navigate('/')}>
							Back to Home
						</Button>
					</div>
				</PlayerError>
			);
		}

		if (view === 'GAME_FULL') {
			return (
				<PlayerError
					emoji="👥"
					title="Game is Full"
					description="Sorry, this game has reached the maximum of 100 players. Please try joining a different game or wait for the next round."
				>
					<Button variant="dark-subtle" onClick={() => navigate('/')}>
						Back to Home
					</Button>
				</PlayerError>
			);
		}

		// Game view
		if (error && connectionState !== 'connected') return <div className="text-red">{error}</div>;

		return (
			<PlayerGameProvider
				gameState={gameState}
				nickname={currentNickname}
				score={myScore ?? 0}
				hasInitialScoreSync={hasInitialScoreSync}
				submittedAnswer={submittedAnswer}
				onAnswer={handleAnswer}
				onSendEmoji={sendEmoji}
				answerResult={answerResult}
				playerId={currentPlayerId}
			>
				<Suspense
					fallback={
						<div className="flex items-center justify-center">
							<Loader2 className="size-12 animate-spin text-orange" />
						</div>
					}
				>
					<PlayerActiveGame />
				</Suspense>
			</PlayerGameProvider>
		);
	};

	return (
		<PlayerPageLayout variant={view === 'GAME' && !isSpinnerVisible ? 'game' : 'center'}>
			<Helmet>
				<title>Play - Timoot</title>
			</Helmet>
			{renderContent()}

			{/* Leave game confirmation dialog */}
			<AlertDialog open={blocker.state === 'blocked'}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="whitespace-nowrap text-red">Leave Game?</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to leave the game?</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => blocker.reset?.()}>Stay in Game</AlertDialogCancel>
						<AlertDialogAction onClick={() => blocker.proceed?.()} variant="danger">
							Leave Game
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</PlayerPageLayout>
	);
}
