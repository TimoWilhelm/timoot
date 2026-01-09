import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card/card';
import { QRCode } from '@/features/game/host/components/qr-code';
import { useHostGameContext } from '@/features/game/host/host-game-context';

export function HostLobby() {
	const { gameState, onStartGame } = useHostGameContext();
	const { players, gameId } = gameState;
	const onStart = onStartGame; // Alias to match existing code usage
	const joinUrl = `${globalThis.location.origin}/play?gameId=${gameId}`;
	const [copied, setCopied] = useState(false);

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(joinUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
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
							{/* Mobile-only: Compact player count */}
							<div
								className={`
									mt-4 flex items-center justify-center gap-2 border-t-2 border-dashed
									border-black/30 pt-4 text-muted-foreground
									lg:hidden
								`}
							>
								<Users className="size-4" />
								<span className="text-sm font-medium">
									{players.length} {players.length === 1 ? 'player' : 'players'} joined
								</span>
							</div>
						</Card>
					</motion.div>

					{/* Right: Players List - hidden on mobile, visible on lg */}
					<motion.div
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
							<CardContent className={`flex grow flex-wrap content-start gap-2 p-4 pt-4`}>
								<AnimatePresence>
									{players.length === 0 ? (
										<p className="font-medium text-muted-foreground">Waiting for players to join...</p>
									) : (
										players.map((p) => (
											<motion.div
												key={p.id}
												initial={{ opacity: 0, scale: 0.5 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.5 }}
												layout
												className={`
													h-fit rounded-lg border-2 border-black bg-orange px-4 py-2
													font-bold shadow-brutal-sm
												`}
											>
												{p.name}
											</motion.div>
										))
									)}
								</AnimatePresence>
							</CardContent>
						</Card>
					</motion.div>
				</div>

				{/* Bottom: Start Button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="flex justify-center"
				>
					<Button
						onClick={onStart}
						variant="accent"
						size="lg"
						className="rounded-xl border-4 px-12 py-8 text-2xl font-black uppercase"
						disabled={players.length === 0}
					>
						{players.length === 0 ? 'Waiting for players...' : 'Start Game'}
					</Button>
				</motion.div>
			</div>
		</div>
	);
}
