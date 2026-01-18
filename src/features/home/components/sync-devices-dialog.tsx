import { Check, Copy, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/dialog';
import { OneTimePasswordField } from '@/components/otp-field';
import { useGenerateSyncCode, useRedeemSyncCode } from '@/hooks/use-api';

interface SyncDevicesDialogProperties {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: string;
	customQuizCount: number;
	onSyncSuccess: (newUserId: string) => void;
}

export function SyncDevicesDialog({ open, onOpenChange, userId, customQuizCount, onSyncSuccess }: SyncDevicesDialogProperties) {
	const [syncCode, setSyncCode] = useState<string | undefined>();
	const [codeCopied, setCodeCopied] = useState(false);
	const [showSyncWarning, setShowSyncWarning] = useState(false);
	const [inputSyncCode, setInputSyncCode] = useState('');

	const generateSyncCodeMutation = useGenerateSyncCode();
	const redeemSyncCodeMutation = useRedeemSyncCode();

	const isGeneratingSyncCode = generateSyncCodeMutation.isPending;
	const isRedeemingSyncCode = redeemSyncCodeMutation.isPending;

	// Reset state when dialog opens/closes
	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			// Reset state when closing
			setSyncCode(undefined);
			setCodeCopied(false);
			setShowSyncWarning(false);
			setInputSyncCode('');
		}
		onOpenChange(newOpen);
	};

	const handleGenerateSyncCode = () => {
		generateSyncCodeMutation.mutate(
			{ header: { 'x-user-id': userId } },
			{
				onSuccess: (data) => {
					setSyncCode(data.code);
				},
				onError: (error) => {
					toast.error(error.message || 'Failed to generate sync code');
				},
			},
		);
	};

	const handleRedeemSyncCode = (confirmed = false) => {
		const code = inputSyncCode;
		if (code.length !== 6) {
			toast.error('Please enter a 6-character code');
			return;
		}
		// Warn if user has existing custom quizzes
		if (!confirmed && customQuizCount > 0) {
			setShowSyncWarning(true);
			return;
		}
		setShowSyncWarning(false);
		redeemSyncCodeMutation.mutate(
			{ header: { 'x-user-id': userId }, json: { code: code.toUpperCase() } },
			{
				onSuccess: (data) => {
					onSyncSuccess(data.userId);
					toast.success('Device synced! Refreshing...');
					handleOpenChange(false);
					// Reload to fetch data with new userId
					globalThis.setTimeout(() => globalThis.location.reload(), 500);
				},
				onError: (error) => {
					toast.error(error.message || 'Failed to redeem sync code');
				},
			},
		);
	};

	const copyCodeToClipboard = () => {
		if (syncCode) {
			void navigator.clipboard.writeText(syncCode);
			setCodeCopied(true);
			globalThis.setTimeout(() => setCodeCopied(false), 2000);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="overflow-hidden border-4 border-black p-0 sm:max-w-106.25">
				<div className="bg-blue p-6">
					<DialogHeader>
						<DialogTitle
							className="
								flex items-center justify-center gap-2 font-display text-2xl font-bold
								whitespace-nowrap uppercase
								sm:justify-start
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
							<motion.button
								className="
									relative w-full rounded-xl border-2 border-black bg-muted py-6
									text-center font-mono text-4xl font-bold tracking-[0.25em]
									transition-colors
									hover:bg-black/5
									active:translate-y-0.5 active:shadow-brutal-inset
								"
								onClick={copyCodeToClipboard}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
							>
								{syncCode}
								<div className="absolute top-1/2 right-4 -translate-y-1/2 p-2">
									{codeCopied ? <Check className="size-5" /> : <Copy className="size-5 text-muted-foreground" />}
								</div>
							</motion.button>
						) : (
							<Button onClick={handleGenerateSyncCode} disabled={isGeneratingSyncCode} className="w-full">
								Generate Code
							</Button>
						)}
					</div>

					<div className="relative py-2">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t-2 border-dashed border-muted-foreground/30" />
						</div>
						<div
							className="
								relative flex justify-center text-xs font-bold tracking-widest uppercase
							"
						>
							<span className="bg-white px-2 text-muted-foreground">OR</span>
						</div>
					</div>

					{/* Redeem Code */}
					<div className="space-y-2">
						<h4 className="font-bold uppercase">Sync to here</h4>
						{showSyncWarning ? (
							<div className="rounded-xl border-2 border-black bg-yellow/20 p-4">
								<p className="mb-2 text-sm font-bold text-black">Warning: Existing Data</p>
								<p className="mb-4 text-xs">Syncing will replace your current quizzes. Are you sure?</p>
								<div className="flex gap-2">
									<Button size="sm" variant="subtle" onClick={() => setShowSyncWarning(false)} className="border-black bg-white">
										Cancel
									</Button>
									<Button size="sm" onClick={() => handleRedeemSyncCode(true)} className="border-black bg-yellow text-black">
										Overwrite & Sync
									</Button>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center gap-4">
								<OneTimePasswordField.Root
									length={6}
									onValueChange={(value) => {
										setInputSyncCode(value);
									}}
									disabled={isRedeemingSyncCode}
								>
									{Array.from({ length: 6 }).map((_, index) => (
										<OneTimePasswordField.Input key={index} index={index} />
									))}
									<OneTimePasswordField.HiddenInput name="syncCode" />
								</OneTimePasswordField.Root>
								<Button onClick={() => handleRedeemSyncCode(false)} disabled={isRedeemingSyncCode || inputSyncCode.length !== 6}>
									Sync Device
								</Button>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
