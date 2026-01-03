import { HostEnd } from '@/components/game/host/host-end';
import { HostGetReady } from '@/components/game/host/host-get-ready';
import { HostLeaderboard } from '@/components/game/host/host-leaderboard';
import { HostLobby } from '@/components/game/host/host-lobby';
import { HostQuestion } from '@/components/game/host/host-question';
import { HostQuestionModifier } from '@/components/game/host/host-question-modifier';
import { HostReveal } from '@/components/game/host/host-reveal';
import { SoundType } from '@/hooks/sound/use-host-sound';
import { WebSocketGameState } from '@/hooks/use-game-web-socket';

interface HostGameContentProperties {
	gameState: WebSocketGameState;
	onStartGame: () => void;
	onNextState: () => void;
	onPlaySound: (sound: SoundType) => void;
	onPlayCountdownTick: (timeLeft: number) => void;
}

export function HostGameContent({ gameState, onStartGame, onNextState, onPlaySound, onPlayCountdownTick }: HostGameContentProperties) {
	switch (gameState.phase) {
		case 'LOBBY': {
			return <HostLobby onStart={onStartGame} players={gameState.players} gameId={gameState.gameId} />;
		}
		case 'GET_READY': {
			return (
				<HostGetReady
					countdownMs={gameState.getReadyCountdownMs}
					totalQuestions={gameState.totalQuestions}
					onCountdownBeep={() => onPlaySound('countdown321')}
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
					onNext={onNextState}
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
					onCountdownTick={onPlayCountdownTick}
					onTimeUp={() => onPlaySound('timeUp')}
				/>
			);
		}
		case 'REVEAL': {
			return (
				<HostReveal
					onNext={onNextState}
					questionText={gameState.questionText}
					options={gameState.options}
					correctAnswerIndex={gameState.correctAnswerIndex!}
					answerCounts={gameState.answerCounts}
				/>
			);
		}
		case 'LEADERBOARD': {
			return <HostLeaderboard onNext={onNextState} leaderboard={gameState.leaderboard} isLastQuestion={gameState.isLastQuestion} />;
		}
		case 'END_INTRO':
		case 'END_REVEALED': {
			return <HostEnd leaderboard={gameState.leaderboard} revealed={gameState.endRevealed} />;
		}
		default: {
			return <div>Unknown game phase.</div>;
		}
	}
}
