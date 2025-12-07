import { Users, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCode } from '@/components/game/QRCode';

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
		<div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-10">
			<div className="w-full max-w-5xl space-y-6">
				{/* Side-by-side layout */}
				<div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-6">
					{/* Left: Join Info */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="flex w-full max-w-sm lg:w-auto lg:max-w-none"
					>
						<Card className="w-full p-6 sm:p-8 shadow-lg rounded-2xl flex flex-col">
							<div className="flex-grow flex flex-col items-center justify-center">
								<p className="text-3xl font-medium mb-4">Join the Game!</p>
								<QRCode value={joinUrl} size={240} />
							</div>
							<div className="mt-6 pt-6 border-t text-center">
								<p className="text-sm text-muted-foreground mb-2">or enter code</p>
								<p className="text-2xl sm:text-3xl font-mono font-bold tracking-wide text-primary whitespace-nowrap">{gameId}</p>
							</div>
							<button
								onClick={copyToClipboard}
								className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								{copied ? (
									<>
										<Check className="w-4 h-4 text-green-500" />
										<span className="text-green-500">Copied!</span>
									</>
								) : (
									<>
										<Copy className="w-4 h-4" />
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
						<Card className="rounded-2xl flex-grow flex flex-col">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-lg">
									<Users className="w-5 h-5" /> Players ({players.length})
								</CardTitle>
							</CardHeader>
							<CardContent className="flex-grow flex flex-wrap content-start gap-2 p-4 pt-0">
								<AnimatePresence>
									{players.length === 0 ? (
										<p className="text-muted-foreground text-sm">Waiting for players to join...</p>
									) : (
										players.map((p) => (
											<motion.div
												key={p.id}
												initial={{ opacity: 0, scale: 0.5 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.5 }}
												layout
												className="bg-quiz-orange text-white font-semibold py-2 px-4 rounded-lg shadow h-fit"
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
						className="bg-quiz-orange text-white text-xl font-bold px-10 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
						disabled={players.length < 1}
					>
						{players.length < 1 ? 'Waiting for players...' : 'Start Game'}
					</Button>
				</motion.div>
			</div>
		</div>
	);
}
