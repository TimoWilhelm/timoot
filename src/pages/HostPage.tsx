import { useEffect } from 'react';
import { Link, useParams, useBlocker } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { HostLobby } from '@/components/game/host/HostLobby';
import { HostQuestion } from '@/components/game/host/HostQuestion';
import { HostReveal } from '@/components/game/host/HostReveal';
import { HostLeaderboard } from '@/components/game/host/HostLeaderboard';
import { HostEnd } from '@/components/game/host/HostEnd';
import { HostGetReady } from '@/components/game/host/HostGetReady';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { useHostStore } from '@/lib/host-store';
import { Button } from '@/components/ui/button';
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

export function HostPage() {
	const { gameId } = useParams<{ gameId: string }>();
	const getSecret = useHostStore((s) => s.getSecret);
	const hostSecret = getSecret(gameId!);

	// Early check for missing host secret - don't even try to connect
	const hasMissingSecret = !hostSecret;

	const { isConnecting, isConnected, error, gameState, startGame, nextState } = useGameWebSocket({
		gameId: hasMissingSecret ? '' : gameId!, // Skip connection if no secret
		role: 'host',
		hostSecret,
		onError: (msg) => toast.error(msg),
	});

	// Block navigation when game is active (not in LOBBY or END)
	const isGameActive = isConnected && gameState.phase !== 'LOBBY' && gameState.phase !== 'END';
	const blocker = useBlocker(isGameActive);

	// Warn before browser/tab close when game is active
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isGameActive) {
				e.preventDefault();
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
			<div className="flex min-h-screen w-full flex-col items-center justify-center bg-red-100 p-4 text-red-800">
				<ShieldAlert className="mb-4 h-16 w-16" />
				<h1 className="mb-2 text-3xl font-bold">{errorTitle}</h1>
				<p className="mb-6 max-w-md text-center">{errorMessage}</p>
				<Button asChild>
					<Link to="/">Return to Home</Link>
				</Button>
			</div>
		);
	}

	if (isConnecting && !isConnected) {
		return (
			<div className="flex min-h-screen w-full items-center justify-center bg-slate-100">
				<Loader2 className="h-16 w-16 animate-spin text-quiz-orange" />
			</div>
		);
	}

	const renderContent = () => {
		switch (gameState.phase) {
			case 'LOBBY':
				return <HostLobby onStart={startGame} players={gameState.players} gameId={gameState.gameId} />;
			case 'GET_READY':
				return <HostGetReady countdownMs={gameState.getReadyCountdownMs} totalQuestions={gameState.totalQuestions} />;
			case 'QUESTION':
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
					/>
				);
			case 'REVEAL':
				return (
					<HostReveal
						onNext={nextState}
						questionText={gameState.questionText}
						options={gameState.options}
						correctAnswerIndex={gameState.correctAnswerIndex!}
						answerCounts={gameState.answerCounts}
					/>
				);
			case 'LEADERBOARD':
				return <HostLeaderboard onNext={nextState} leaderboard={gameState.leaderboard} isLastQuestion={gameState.isLastQuestion} />;
			case 'END':
				return <HostEnd leaderboard={gameState.leaderboard} />;
			default:
				return <div>Unknown game phase.</div>;
		}
	};

	return (
		<div className="flex min-h-screen w-full flex-col bg-slate-100 text-slate-900">
			<AnimatePresence mode="wait">
				<motion.main
					key={gameState.phase}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.3 }}
					className="flex flex-grow flex-col"
				>
					{renderContent()}
				</motion.main>
			</AnimatePresence>
			<Toaster richColors />

			{/* Leave game confirmation dialog */}
			<AlertDialog open={blocker.state === 'blocked'}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Leave Game?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to leave the game?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => blocker.reset?.()}>Stay in Game</AlertDialogCancel>
						<AlertDialogAction onClick={() => blocker.proceed?.()} className="bg-red-500 hover:bg-red-600">
							Leave Game
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
