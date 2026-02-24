import { Check, Copy, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { QRCode } from '@/features/game/host/components/qr-code';
import { useHostGameContext } from '@/features/game/host/host-game-context';
import { cn } from '@/lib/utilities';

interface PlayerChipProperties {
	name: string;
	variant?: 'compact' | 'default';
	onRemove?: () => void;
}

function PlayerChip({ name, variant = 'default', onRemove }: PlayerChipProperties) {
	const isCompact = variant === 'compact';
	const isRemovable = !!onRemove;
	const [isHovered, setIsHovered] = useState(false);

	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.5 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.5 }}
			transition={{
				type: 'spring',
				stiffness: 500,
				damping: 30,
				mass: 1,
			}}
			className={cn(
				'relative',
				isCompact
					? `
						mr-2 mb-2 rounded-md border-2 border-black bg-orange px-3 py-1 text-xs
						font-bold text-black shadow-brutal-sm
					`
					: `
						h-fit rounded-lg border-2 border-black bg-orange px-4 py-2 font-bold
						shadow-brutal-sm
					`,
				isRemovable &&
					`
						cursor-pointer transition-transform select-none
						hover:scale-105
						active:scale-95
					`,
			)}
			onClick={onRemove}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			role={isRemovable ? 'button' : undefined}
			tabIndex={isRemovable ? 0 : undefined}
			aria-label={isRemovable ? `Remove ${name}` : undefined}
			onKeyDown={
				isRemovable
					? (event: React.KeyboardEvent) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								onRemove?.();
							}
						}
					: undefined
			}
		>
			{name}
			{isRemovable && (
				<AnimatePresence>
					{isHovered && (
						<motion.span
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0 }}
							transition={{
								type: 'spring',
								stiffness: 500,
								damping: 25,
							}}
							className={cn(
								`
									pointer-events-none absolute flex items-center justify-center
									rounded-full border-2 border-black bg-red text-white shadow-brutal-sm
								`,
								isCompact ? '-top-1.5 -right-1.5 size-5' : '-top-2 -right-2 size-6',
							)}
						>
							<X className={isCompact ? 'size-3' : 'size-3.5'} strokeWidth={3} />
						</motion.span>
					)}
				</AnimatePresence>
			)}
		</motion.div>
	);
}

interface PlayerListProperties {
	players: { id: string; name: string }[];
	variant?: 'compact' | 'default';
	reversed?: boolean;
	onRemovePlayer?: (player: { id: string; name: string }) => void;
}

function PlayerList({ players, variant = 'default', reversed = false, onRemovePlayer }: PlayerListProperties) {
	const displayPlayers = reversed ? players.toReversed() : players;

	if (players.length === 0) {
		return variant === 'compact' ? (
			<p className="text-xs font-bold text-muted-foreground/50 italic">Waiting for players...</p>
		) : (
			<p className="font-medium text-muted-foreground">Waiting for players to join...</p>
		);
	}

	return (
		<AnimatePresence mode={variant === 'compact' ? 'popLayout' : 'sync'}>
			{displayPlayers.map((p) => (
				<PlayerChip key={p.id} name={p.name} variant={variant} onRemove={onRemovePlayer ? () => onRemovePlayer(p) : undefined} />
			))}
		</AnimatePresence>
	);
}

export function HostLobby() {
	const { gameState, onStartGame, onRemovePlayer } = useHostGameContext();
	const { players, gameId } = gameState;
	const joinUrl = `${globalThis.location.origin}/play?gameId=${gameId}`;
	const [copied, setCopied] = useState(false);
	const [playerToRemove, setPlayerToRemove] = useState<{ id: string; name: string } | undefined>();

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(joinUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleConfirmRemove = () => {
		if (playerToRemove) {
			onRemovePlayer(playerToRemove.id);
			setPlayerToRemove(undefined);
		}
	};

	return (
		<div
			className={`
				flex grow flex-col items-center justify-center p-6
				sm:p-10
			`}
		>
			<div className="w-full max-w-5xl space-y-8">
				{/* Side-by-side layout */}
				<div
					className={`
						flex flex-col items-center justify-center gap-6
						lg:flex-row lg:items-stretch
					`}
				>
					{/* Left: Join Info */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className={`
							flex w-full max-w-sm
							lg:w-auto lg:max-w-none
						`}
					>
						<Card
							className={`
								flex w-full flex-col p-6
								sm:p-8
							`}
						>
							<div className="flex grow flex-col items-center justify-center">
								<p className="mb-4 font-display text-3xl font-bold">Join the Game!</p>
								<div className="rounded-lg border-2 border-black p-2 shadow-brutal-sm">
									<QRCode value={joinUrl} size={240} />
								</div>
							</div>
							<div className="mt-6 border-t-2 border-black pt-6 text-center">
								<p className="mb-2 text-sm font-bold text-muted-foreground uppercase">or enter code</p>
								<p
									className={`
										rounded-lg border-2 border-black bg-yellow px-4 py-2 font-mono
										text-2xl font-bold tracking-wider shadow-brutal-sm
										sm:text-3xl
									`}
								>
									{gameId}
								</p>
							</div>
							<Button type="button" variant="subtle" onClick={copyToClipboard} className="mt-4 w-full">
								{copied ? (
									<>
										<Check className="size-4 text-green" />
										<span className="text-green">Copied!</span>
									</>
								) : (
									<>
										<Copy className="size-4" />
										<span>Copy link</span>
									</>
								)}
							</Button>
							{/* Mobile-only: Compact player count & Recent list */}
							<div
								role="region"
								aria-label="Player summary"
								className={`
									mt-4 flex flex-col gap-4 border-t-2 border-dashed border-black/30 pt-4
									lg:hidden
								`}
							>
								<div
									className="
										flex items-center justify-center gap-2 text-muted-foreground
									"
								>
									<Users className="size-4" />
									<span className="text-sm font-medium">
										{players.length} {players.length === 1 ? 'player' : 'players'} joined
									</span>
								</div>

								<div className="relative max-h-40 w-full overflow-y-auto overscroll-contain">
									<div className="flex flex-wrap justify-center px-2 pt-2 pb-1">
										<PlayerList players={players} variant="compact" reversed onRemovePlayer={setPlayerToRemove} />
									</div>
								</div>
							</div>
						</Card>
					</motion.div>

					{/* Right: Players List - hidden on mobile, visible on lg */}
					<motion.div
						role="region"
						aria-label="Players list"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.1 }}
						className={`
							hidden w-full max-w-sm
							lg:flex lg:flex-1
						`}
					>
						<Card className="flex grow flex-col">
							<CardHeader className="border-b-2 border-black pb-4">
								<CardTitle className="flex items-center gap-2 text-xl">
									<div
										className={`
											flex size-8 items-center justify-center rounded-lg border-2
											border-black bg-blue shadow-brutal-sm
										`}
									>
										<Users className="size-4" />
									</div>
									Players ({players.length})
								</CardTitle>
							</CardHeader>
							<CardContent className={`flex grow flex-wrap content-start gap-2 p-5 pt-5`}>
								<PlayerList players={players} onRemovePlayer={setPlayerToRemove} />
							</CardContent>
						</Card>
					</motion.div>
				</div>

				{/* Bottom: Start Button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="flex w-full justify-center"
				>
					<Button
						onClick={onStartGame}
						variant="accent"
						size="lg"
						className={`
							w-full max-w-sm rounded-xl border-4 p-4 text-lg font-black uppercase
							sm:px-12 sm:py-8 sm:text-2xl
						`}
						disabled={players.length === 0}
					>
						{players.length === 0 ? 'Waiting for players...' : 'Start Game'}
					</Button>
				</motion.div>
			</div>

			{/* Remove player confirmation dialog */}
			<AlertDialog open={playerToRemove !== undefined} onOpenChange={(open) => !open && setPlayerToRemove(undefined)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle
							className="
								font-display text-2xl font-bold whitespace-nowrap text-red uppercase
							"
						>
							Remove Player?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-base font-medium text-black">
							Are you sure you want to remove <span className="font-bold">{playerToRemove?.name}</span> from the game?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmRemove} variant="danger">
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
