import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { Link, useBlocker, useParams } from 'react-router-dom';
import { Toaster, toast } from 'sonner';

import { HostEnd } from '@/components/game/host/host-end';
import { HostGetReady } from '@/components/game/host/host-get-ready';
import { HostLeaderboard } from '@/components/game/host/host-leaderboard';
import { HostLobby } from '@/components/game/host/host-lobby';
import { HostPageLayout } from '@/components/game/host/host-page-layout';
import { HostQuestion } from '@/components/game/host/host-question';
import { HostQuestionModifier } from '@/components/game/host/host-question-modifier';
import { HostReveal } from '@/components/game/host/host-reveal';
import { FloatingEmojis, type FloatingEmojisHandle } from '@/components/game/shared';
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
import { Button } from '@/components/ui/button';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { useGameWebSocket } from '@/hooks/use-game-web-socket';
import { type MusicTrack, useHostSound } from '@/hooks/use-host-sound';
import { useHostStore } from '@/lib/host-store';

import type { EmojiReaction, GamePhase } from '@shared/types';

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

const phaseIsActive: Record<GamePhase, boolean> = {
	LOBBY: false,
	GET_READY: true,
	QUESTION_MODIFIER: true,
	QUESTION: true,
	REVEAL: true,
	LEADERBOARD: true,
	END_INTRO: false,
	END_REVEALED: false,
};

const phaseAllowsManualAdvance: Record<GamePhase, boolean> = {
	LOBBY: false,
	GET_READY: false,
	QUESTION_MODIFIER: false,
	QUESTION: false,
	REVEAL: true,
	LEADERBOARD: true,
	END_INTRO: false,
	END_REVEALED: false,
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

	const { isConnecting, isConnected, error, gameState, startGame, nextState } = useGameWebSocket({
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
	const isGameActive = isConnected && phaseIsActive[gameState.phase];

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
			if (!isConnected) return;
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
	}, [isConnected, gameState.phase, nextState]);

	// Play sounds on game phase changes or reconnection
	useEffect(() => {
		if (!isConnected) {
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
	}, [isConnected, gameState.phase, gameState.modifiers, playSound, startBackgroundMusic, stopBackgroundMusic]);

	// Play sound when new player joins lobby
	useEffect(() => {
		if (!isConnected || gameState.phase !== 'LOBBY') return;

		const currentCount = gameState.players.length;
		// Only play sound if we have a previous count to compare against (not initial render)
		if (previousPlayersCountReference.current !== null && currentCount > previousPlayersCountReference.current) {
			playSound('playerJoin');
		}
		previousPlayersCountReference.current = currentCount;
	}, [isConnected, gameState.phase, gameState.players.length, playSound]);

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
	if (hasMissingSecret || (error && !isConnected)) {
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

	if (isConnecting && !isConnected) {
		return (
			<HostPageLayout variant="center">
				<div
					className={`
						relative flex size-24 items-center justify-center rounded-full border-4
						border-black bg-yellow shadow-brutal-sm
					`}
				>
					<Loader2 className="size-12 animate-spin text-black" strokeWidth={3} />
				</div>
			</HostPageLayout>
		);
	}

	const renderContent = () => {
		switch (gameState.phase) {
			case 'LOBBY': {
				return (
					<HostLobby
						onStart={() => {
							handleAudioInit();
							startGame();
						}}
						players={gameState.players}
						gameId={gameState.gameId}
					/>
				);
			}
			case 'GET_READY': {
				return (
					<HostGetReady
						countdownMs={gameState.getReadyCountdownMs}
						totalQuestions={gameState.totalQuestions}
						onCountdownBeep={() => playSound('countdown321')}
					/>
				);
			}
			case 'QUESTION_MODIFIER': {
				return (
					<HostQuestionModifier
						questionIndex={gameState.questionIndex}
						totalQuestions={gameState.totalQuestions}
						modifiers={gameState.modifiers}
					/>
				);
			}
			case 'QUESTION': {
				return (
					<HostQuestion
						onNext={nextState}
						questionText={gameState.questionText}
						options={gameState.options}
						questionIndex={gameState.questionIndex}
						totalQuestions={gameState.totalQuestions}
						startTime={gameState.startTime}
						timeLimitMs={gameState.timeLimitMs}
						answeredCount={gameState.answeredCount}
						totalPlayers={gameState.players.length}
						isDoublePoints={gameState.isDoublePoints}
						backgroundImage={gameState.backgroundImage}
						onCountdownTick={playCountdownTick}
						onTimeUp={() => playSound('timeUp')}
					/>
				);
			}
			case 'REVEAL': {
				return (
					<HostReveal
						onNext={nextState}
						questionText={gameState.questionText}
						options={gameState.options}
						correctAnswerIndex={gameState.correctAnswerIndex!}
						answerCounts={gameState.answerCounts}
					/>
				);
			}
			case 'LEADERBOARD': {
				return <HostLeaderboard onNext={nextState} leaderboard={gameState.leaderboard} isLastQuestion={gameState.isLastQuestion} />;
			}
			case 'END_INTRO':
			case 'END_REVEALED': {
				return <HostEnd leaderboard={gameState.leaderboard} revealed={gameState.endRevealed} />;
			}
			default: {
				return <div>Unknown game phase.</div>;
			}
		}
	};

	return (
		<HostPageLayout>
			{/* Sound toggle button - fixed position */}
			<div className="fixed top-4 left-4 z-50">
				<SoundToggle onToggle={handleAudioInit} />
			</div>

			<AnimatePresence mode="wait">
				<motion.main
					key={gameState.phase}
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ type: 'spring', stiffness: 260, damping: 20 }}
					className="relative flex grow flex-col"
				>
					{renderContent()}
				</motion.main>
			</AnimatePresence>
			<Toaster richColors />

			{/* Floating emojis from players */}
			<FloatingEmojis ref={floatingEmojisReference} />

			{/* Leave game confirmation dialog */}
			<AlertDialog open={blocker.state === 'blocked'}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-red">Leave Game?</AlertDialogTitle>
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
