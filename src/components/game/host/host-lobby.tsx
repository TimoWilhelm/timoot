import { Check, Copy, Users } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCode } from '@/components/game/shared';

interface HostLobbyProps {
	onStart: () => void;
	players: { id: string; name: string }[];
	gameId: string;
}

export function HostLobby({ onStart, players, gameId }: HostLobbyProps) {
	const joinUrl = `${window.location.origin}/play?gameId=${gameId}`;
	const [copied, setCopied] = useState(false);

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(joinUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex flex-grow flex-col items-center justify-center p-6 sm:p-10">
			<div className="w-full max-w-5xl space-y-6">
				{/* Side-by-side layout */}
				<div className="flex flex-col items-center justify-center gap-6 lg:flex-row lg:items-stretch">
					{/* Left: Join Info */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="flex w-full max-w-sm lg:w-auto lg:max-w-none"
					>
						<Card className="flex w-full flex-col rounded-2xl p-6 shadow-lg sm:p-8">
							<div className="flex flex-grow flex-col items-center justify-center">
								<p className="mb-4 text-3xl font-medium">Join the Game!</p>
								<QRCode value={joinUrl} size={240} />
							</div>
							<div className="mt-6 border-t pt-6 text-center">
								<p className="mb-2 text-sm text-muted-foreground">or enter code</p>
								<p className="whitespace-nowrap font-mono text-2xl font-bold tracking-wide text-primary sm:text-3xl">{gameId}</p>
							</div>
							<button
								onClick={copyToClipboard}
								className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
							>
								{copied ? (
									<>
										<Check className="h-4 w-4 text-green-500" />
										<span className="text-green-500">Copied!</span>
									</>
								) : (
									<>
										<Copy className="h-4 w-4" />
										<span>Copy link</span>
									</>
								)}
							</button>
						</Card>
					</motion.div>

					{/* Right: Players List */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.1 }}
						className="flex w-full max-w-sm lg:flex-1"
					>
						<Card className="flex flex-grow flex-col rounded-2xl">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-lg">
									<Users className="h-5 w-5" /> Players ({players.length})
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-grow flex-wrap content-start gap-2 p-4 pt-0">
								<AnimatePresence>
									{players.length === 0 ? (
										<p className="text-sm text-muted-foreground">Waiting for players to join...</p>
									) : (
										players.map((p) => (
											<motion.div
												key={p.id}
												initial={{ opacity: 0, scale: 0.5 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.5 }}
												layout
												className="h-fit rounded-lg bg-quiz-orange px-4 py-2 font-semibold text-white shadow"
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
						size="lg"
						className="transform rounded-2xl bg-quiz-orange px-10 py-6 text-xl font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
						disabled={players.length < 1}
					>
						{players.length < 1 ? 'Waiting for players...' : 'Start Game'}
					</Button>
				</motion.div>
			</div>
		</div>
	);
}
