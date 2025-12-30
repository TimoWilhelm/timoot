import { Check, Copy, RefreshCw } from 'lucide-react';
import { BRUTAL_INPUT } from './styles';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utilities';

interface SyncDevicesDialogProperties {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	syncCode: string | undefined;
	syncCodeInput: string;
	codeCopied: boolean;
	showSyncWarning: boolean;
	isGeneratingSyncCode: boolean;
	isRedeemingSyncCode: boolean;
	turnstileToken: string | null;
	TurnstileWidget: React.ComponentType<{ className?: string }>;
	onSyncCodeInputChange: (value: string) => void;
	onGenerateSyncCode: () => void;
	onRedeemSyncCode: (confirmed: boolean) => void;
	onCopyCode: () => void;
	onCancelWarning: () => void;
}

export function SyncDevicesDialog({
	open,
	onOpenChange,
	syncCode,
	syncCodeInput,
	codeCopied,
	showSyncWarning,
	isGeneratingSyncCode,
	isRedeemingSyncCode,
	turnstileToken,
	TurnstileWidget,
	onSyncCodeInputChange,
	onGenerateSyncCode,
	onRedeemSyncCode,
	onCopyCode,
	onCancelWarning,
}: SyncDevicesDialogProperties) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="overflow-hidden border-4 border-black p-0 sm:max-w-[425px]">
				<div className="bg-blue-400 p-6">
					<DialogHeader>
						<DialogTitle
							className="
								flex items-center gap-2 font-display text-2xl font-bold uppercase
							"
						>
							<RefreshCw className="size-6" />
							Sync Devices
						</DialogTitle>
					</DialogHeader>
				</div>
				<div className="space-y-6 p-6">
					{/* Generate Code */}
					<div className="space-y-2">
						<h4 className="font-bold uppercase">Share from here</h4>
						{syncCode ? (
							<div className="flex items-center gap-2">
								<div
									className="
										flex-1 rounded-xl border-2 border-black bg-gray-100 p-3 text-center
										font-mono text-2xl font-bold tracking-widest
									"
								>
									{syncCode}
								</div>
								<Button
									onClick={onCopyCode}
									size="icon"
									className="
										size-14 shrink-0 rounded-xl border-2 border-black shadow-brutal
									"
								>
									{codeCopied ? <Check className="size-6" /> : <Copy className="size-6" />}
								</Button>
							</div>
						) : (
							<div className="space-y-2">
								<TurnstileWidget className="flex justify-center" />
								<Button
									onClick={onGenerateSyncCode}
									disabled={isGeneratingSyncCode || !turnstileToken}
									className="w-full border-2 border-black font-bold shadow-brutal"
								>
									Generate Code
								</Button>
							</div>
						)}
					</div>

					<div className="relative py-2">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t-2 border-dashed border-gray-300" />
						</div>
						<div
							className="
								relative flex justify-center text-xs font-bold tracking-widest uppercase
							"
						>
							<span className="bg-white px-2 text-gray-400">OR</span>
						</div>
					</div>

					{/* Redeem Code */}
					<div className="space-y-2">
						<h4 className="font-bold uppercase">Sync to here</h4>
						{showSyncWarning ? (
							<div className="rounded-xl border-2 border-black bg-yellow-100 p-4">
								<p className="mb-2 text-sm font-bold text-yellow-800">Warning: Existing Data</p>
								<p className="mb-4 text-xs">Syncing will replace your current quizzes. Are you sure?</p>
								<div className="flex gap-2">
									<Button size="sm" variant="secondary" onClick={onCancelWarning} className="border-black bg-white">
										Cancel
									</Button>
									<Button size="sm" onClick={() => onRedeemSyncCode(true)} className="border-black bg-yellow-400 text-black">
										Overwrite & Sync
									</Button>
								</div>
							</div>
						) : (
							<div className="flex gap-2">
								<Input
									placeholder="ENTER CODE"
									value={syncCodeInput}
									onChange={(event) => onSyncCodeInputChange(event.target.value.toUpperCase())}
									className={cn(BRUTAL_INPUT, 'flex-1 text-center font-mono tracking-widest uppercase')}
									maxLength={6}
								/>
								<Button onClick={() => onRedeemSyncCode(false)} disabled={isRedeemingSyncCode || syncCodeInput.length !== 6}>
									<Check className="size-5" />
								</Button>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
