import { ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useBlocker, useParams } from 'react-router-dom';
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
import { SoundToggle } from '@/components/sound-toggle';
import { Spinner } from '@/components/spinner/spinner';
import { useGameWebSocket } from '@/features/game/hooks/use-game-web-socket';
import { type MusicTrack, useHostSound } from '@/features/game/hooks/use-host-sound';
import { FloatingEmojis, type FloatingEmojisHandle } from '@/features/game/host/components/floating-emojis';
import { HostGameProvider } from '@/features/game/host/host-game-provider';
import { HostPageLayout } from '@/features/game/host/host-page-layout';
import { useHostStore } from '@/lib/stores/host-store';
import { isGamePhaseActive, phaseAllowsManualAdvance } from '@shared/phase-rules';

import type { EmojiReaction, GamePhase } from '@shared/types';

// Lazy load the heavy game content component
const HostGameContent = lazy(() => import('@/features/game/host/host-game-content').then((m) => ({ default: m.HostGameContent })));

const phaseToMusicTrack: Record<GamePhase, MusicTrack | null> = {
	LOBBY: 'lobby',
	GET_READY: 'getReady',
	QUESTION_MODIFIER: 'questionModifier',
	QUESTION: 'question',
	REVEAL: 'reveal',
	LEADERBOARD: 'leaderboard',
	END_INTRO: 'celebration',
	END_REVEALED: 'celebration',
};

const getMusicTrackForPhase = (phase: GamePhase): MusicTrack | null => {
	return phaseToMusicTrack[phase];
};

export function HostPage() {
	const { gameId } = useParams<{ gameId: string }>();
	const getSecret = useHostStore((s) => s.getSecret);
	const hostSecret = getSecret(gameId!);

	// Early check for missing host secret - don't even try to connect
	const hasMissingSecret = !hostSecret;

	const { playSound, playCountdownTick, initAudio, startBackgroundMusic, stopBackgroundMusic } = useHostSound();
	const previousPhaseReference = useRef<GamePhase | null>(null);
	const wasConnectedReference = useRef<boolean>(false);
	const previousPlayersCountReference = useRef<number | null>(null);
	const floatingEmojisReference = useRef<FloatingEmojisHandle>(null);
	const keyboardNavEnabledAtReference = useRef<number>(0);

	// Handle emoji received from players
	const handleEmojiReceived = useCallback((emoji: EmojiReaction) => {
		floatingEmojisReference.current?.addEmoji(emoji);
	}, []);

	const { connectionState, error, gameState, startGame, nextState } = useGameWebSocket({
		gameId: hasMissingSecret ? '' : gameId!, // Skip connection if no secret
		role: 'host',
		hostSecret,
		onError: (message) => toast.error(message),
		onEmojiReceived: handleEmojiReceived,
	});

	// Clear floating emojis when question starts
	useEffect(() => {
		if (gameState.phase === 'QUESTION') {
			floatingEmojisReference.current?.clearAll();
		}
	}, [gameState.phase]);

	// Initialize audio and start music for current phase
	const handleAudioInit = () => {
		initAudio();
		const track = getMusicTrackForPhase(gameState.phase);
		if (track) {
			startBackgroundMusic(track);
		}
	};

	// Track if game is in an active phase
	const isGameActive = connectionState === 'connected' && isGamePhaseActive[gameState.phase];

	// Block navigation when game is active (not in LOBBY or END)
	const blocker = useBlocker(isGameActive);

	// Set delay before keyboard navigation is allowed after phase change
	useEffect(() => {
		const KEYBOARD_NAV_DELAY_MS = 1000;
		keyboardNavEnabledAtReference.current = Date.now() + KEYBOARD_NAV_DELAY_MS;
	}, [gameState.phase]);

	// Allow host to advance with common presenter keys (right arrow, page down, space, enter)
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const { repeat, key } = event;

			if (repeat) return;

			if (key !== 'ArrowRight' && key !== 'PageDown' && key !== ' ' && key !== 'Enter') return;

			// Only allow advancing when connected and in phases that have a manual Next button
			if (connectionState !== 'connected') return;
			if (!phaseAllowsManualAdvance[gameState.phase]) return;

			// Prevent advancing too quickly after phase change
			if (Date.now() < keyboardNavEnabledAtReference.current) return;

			// Only allow advancing when a visible Next button is rendered and enabled
			const nextButton = document.querySelector<HTMLButtonElement>('[data-host-next-button]');
			if (!nextButton || nextButton.disabled) return;

			// Prevent default scrolling behavior for these keys
			event.preventDefault();
			nextState();
		};

		globalThis.addEventListener('keydown', handleKeyDown);
		return () => globalThis.removeEventListener('keydown', handleKeyDown);
	}, [connectionState, gameState.phase, nextState]);

	// Play sounds on game phase changes or reconnection
	useEffect(() => {
		if (connectionState !== 'connected') {
			wasConnectedReference.current = false;
			return;
		}

		const currentPhase = gameState.phase;
		const previousPhase = previousPhaseReference.current;
		const isReconnecting = !wasConnectedReference.current;
		wasConnectedReference.current = true;

		// Play music on phase change OR on reconnection (to resume music)
		if (previousPhase !== currentPhase || isReconnecting) {
			const track = phaseToMusicTrack[currentPhase];
			if (track) {
				startBackgroundMusic(track);
			}
		}

		// Play sound effects only on actual phase changes (not reconnection)
		if (previousPhase !== currentPhase) {
			// Play sound effects
			switch (currentPhase) {
				case 'LOBBY': {
					// No specific sound when entering lobby from another phase
					break;
				}
				case 'GET_READY': {
					playSound('gameStart');
					break;
				}
				case 'QUESTION_MODIFIER': {
					// Play double points sound when entering modifier phase
					if (gameState.modifiers.includes('doublePoints')) {
						playSound('doublePoints');
					}
					break;
				}
				case 'QUESTION': {
					// Only play question start sound if coming from non-modifier phase
					if (previousPhase !== 'QUESTION_MODIFIER') {
						playSound('questionStart');
					}
					break;
				}
				case 'REVEAL': {
					playSound('reveal');
					break;
				}
				case 'LEADERBOARD': {
					playSound('leaderboard');
					break;
				}
				case 'END_INTRO': {
					playSound('gameEnd');
					break;
				}
				case 'END_REVEALED': {
					// No sound for reveal transition
					break;
				}
				default: {
					const _exhaustiveCheck: never = currentPhase;
					return _exhaustiveCheck;
				}
			}
			previousPhaseReference.current = currentPhase;
		}
	}, [connectionState, gameState.phase, gameState.modifiers, playSound, startBackgroundMusic, stopBackgroundMusic]);

	// Play sound when new player joins lobby
	useEffect(() => {
		if (connectionState !== 'connected' || gameState.phase !== 'LOBBY') return;

		const currentCount = gameState.players.length;
		// Only play sound if we have a previous count to compare against (not initial render)
		if (previousPlayersCountReference.current !== null && currentCount > previousPlayersCountReference.current) {
			playSound('playerJoin');
		}
		previousPlayersCountReference.current = currentCount;
	}, [connectionState, gameState.phase, gameState.players.length, playSound]);

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

	// Show error immediately for missing secret (before loading check)
	if (hasMissingSecret || (error && connectionState !== 'connected')) {
		const errorTitle = hasMissingSecret ? 'Session Expired' : 'Access Denied';
		const errorMessage = hasMissingSecret
			? 'Your host session for this game was not found. This can happen if you cleared your browser data or are using a different browser.'
			: 'Unable to connect as host. The game may have ended or your session is no longer valid.';

		return (
			<HostPageLayout variant="center">
				<div
					className={`
						relative flex flex-col items-center rounded-xl border-4 border-black
						bg-red/10 p-8 shadow-brutal-lg
					`}
				>
					<div
						className={`
							mb-4 flex size-20 items-center justify-center rounded-full border-2
							border-black bg-red shadow-brutal
						`}
					>
						<ShieldAlert className="size-10 text-white" />
					</div>
					<h1 className="mb-2 font-display text-3xl font-bold text-red">{errorTitle}</h1>
					<p className="mb-6 max-w-md text-center font-medium text-red">{errorMessage}</p>
					<Button asChild variant="link">
						<Link to="/" viewTransition>
							Return to Home
						</Link>
					</Button>
				</div>
			</HostPageLayout>
		);
	}

	if (connectionState === 'connecting') {
		return (
			<HostPageLayout variant="center">
				<div className="relative flex items-center justify-center">
					<Spinner />
				</div>
			</HostPageLayout>
		);
	}

	return (
		<HostPageLayout>
			<Helmet>
				<title>Host Game - Timoot</title>
			</Helmet>
			{/* Sound toggle button - fixed position, responsive spacing */}
			<div
				className="
					fixed top-2 left-2 z-40
					sm:top-4 sm:left-4
				"
			>
				<SoundToggle onToggle={handleAudioInit} />
			</div>

			<AnimatePresence mode="wait">
				<motion.main
					key={gameState.phase}
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.15, ease: 'easeOut' }}
					className="relative flex grow flex-col"
				>
					<HostGameProvider
						gameState={gameState}
						onStartGame={() => {
							handleAudioInit();
							startGame();
						}}
						onNextState={nextState}
						onPlaySound={playSound}
						onPlayCountdownTick={playCountdownTick}
					>
						<Suspense
							fallback={
								<div className="flex grow items-center justify-center">
									<Spinner />
								</div>
							}
						>
							<HostGameContent />
						</Suspense>
					</HostGameProvider>
				</motion.main>
			</AnimatePresence>

			{/* Floating emojis from players */}
			<FloatingEmojis ref={floatingEmojisReference} />

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
		</HostPageLayout>
	);
}
