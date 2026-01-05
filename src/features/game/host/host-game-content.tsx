import { HostEnd } from '@/features/game/host/host-end';
import { useHostGameContext } from '@/features/game/host/host-game-context';
import { HostGetReady } from '@/features/game/host/host-get-ready';
import { HostLeaderboard } from '@/features/game/host/host-leaderboard';
import { HostLobby } from '@/features/game/host/host-lobby';
import { HostQuestion } from '@/features/game/host/host-question';
import { HostQuestionModifier } from '@/features/game/host/host-question-modifier';
import { HostReveal } from '@/features/game/host/host-reveal';

export function HostGameContent() {
	const { gameState } = useHostGameContext();

	switch (gameState.phase) {
		case 'LOBBY': {
			return <HostLobby />;
		}
		case 'GET_READY': {
			return <HostGetReady />;
		}
		case 'QUESTION_MODIFIER': {
			return <HostQuestionModifier />;
		}
		case 'QUESTION': {
			return <HostQuestion />;
		}
		case 'REVEAL': {
			return <HostReveal />;
		}
		case 'LEADERBOARD': {
			return <HostLeaderboard />;
		}
		case 'END_INTRO':
		case 'END_REVEALED': {
			return <HostEnd />;
		}
		default: {
			return <div>Unknown game phase.</div>;
		}
	}
}
