import { AlertCircle, ArrowRight, Check, Gamepad2 } from 'lucide-react';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/popover';
import { useGameCode } from '@/features/game/hooks/use-game-code';
import { useViewTransitionNavigate } from '@/hooks/ui/use-view-transition-navigate';
import { cn } from '@/lib/utilities';

export function PlayerJoinGame() {
	const navigate = useViewTransitionNavigate();
	const {
		value,
		suggestions,
		showSuggestions,
		setShowSuggestions,
		autoCompleteFlash,
		showInvalidTooltip,
		errorMessage,
		isValidating,
		gameNotFound,
		selectedIndex,
		placeholder,
		inputReference,
		currentPart,
		wordInfo,
		isComplete,
		partValidation,
		handleInputChange,
		handleSelectSuggestion,
		handleJoin,
		handleKeyDown,
		handleSelect,
	} = useGameCode();

	const handleGoHome = () => {
		navigate('/');
	};

	return (
		<Card
			className={`
				relative w-full max-w-md border-4 border-black bg-zinc shadow-brutal
			`}
		>
			<CardHeader className="border-b-2 border-black text-center">
				<div className="flex justify-center">
					<div
						className={`
							flex size-16 items-center justify-center rounded-xl border-4 border-black
							bg-orange shadow-brutal
						`}
					>
						<Gamepad2 className="size-8 text-white" />
					</div>
				</div>
				<CardTitle className="font-display text-3xl text-white">Join Game</CardTitle>
				<p className="text-sm text-muted-foreground">Enter the game code shown on the host's screen</p>
			</CardHeader>
			<CardContent className="space-y-6 pt-6">
				{/* Game Code Input */}
				<div
					className={`
						space-y-4 rounded-2xl border border-black bg-black/20 p-6
						focus-within:outline-2 focus-within:outline-black
					`}
				>
					<Popover open={showSuggestions && suggestions.length > 0 && !isComplete && currentPart.length > 0}>
						<PopoverAnchor asChild>
							<div className="relative">
								<input
									ref={inputReference}
									type="text"
									value={value}
									onChange={handleInputChange}
									onKeyDown={handleKeyDown}
									onSelect={handleSelect}
									onFocus={() => setShowSuggestions(true)}
									onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
									placeholder={placeholder}
									autoFocus
									autoComplete="off"
									autoCorrect="off"
									autoCapitalize="off"
									spellCheck={false}
									className={cn(
										'h-14 w-full rounded-xl px-4 text-center font-mono text-xl',
										'border-2 border-black bg-black',
										`
											overflow-hidden text-ellipsis text-white
											placeholder:text-ellipsis placeholder:text-muted-foreground/75
										`,
										'focus:outline-none',
										'transition-all duration-200',
										isComplete && 'border-green bg-green/10 pr-12',
										autoCompleteFlash && 'border-black bg-orange/20',
										showInvalidTooltip && 'border-red bg-red/10',
									)}
								/>
								{isComplete && (
									<div className="absolute top-1/2 right-4 -translate-y-1/2">
										<Check className="size-5 text-green" />
									</div>
								)}
								{/* Invalid input tooltip - positioned above */}
								<div
									className={cn(
										'absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg px-3 py-2',
										'border border-red bg-red/90 text-sm text-white',
										'flex items-center gap-2 whitespace-nowrap',
										'transition-all duration-200',
										showInvalidTooltip ? 'translate-y-0 opacity-100' : `pointer-events-none translate-y-2 opacity-0`,
									)}
								>
									<AlertCircle className="size-4" />
									{errorMessage}
								</div>
							</div>
						</PopoverAnchor>
						<PopoverContent
							className={`
								w-(--radix-popover-trigger-width) border-black bg-zinc-dark p-0
							`}
							align="start"
							onOpenAutoFocus={(event) => event.preventDefault()}
						>
							<div className="py-1">
								<div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{wordInfo?.label}</div>
								{suggestions.map((word, index) => (
									<div
										key={word}
										onClick={() => handleSelectSuggestion(word)}
										className={cn(
											`
												mx-1 cursor-pointer rounded-xs px-2 py-1.5 font-mono text-sm
												text-white
											`,
											index === selectedIndex ? 'bg-zinc' : 'hover:bg-zinc/50',
										)}
									>
										{word.toLowerCase()}
									</div>
								))}
							</div>
						</PopoverContent>
					</Popover>

					{/* Validation hints */}
					<div className="flex justify-center gap-2 text-xs select-none">
						<span
							className={cn(
								'rounded-sm px-2 py-1',
								partValidation.adjective === true
									? 'bg-green/20 text-green'
									: partValidation.adjective === false
										? 'bg-red/20 text-red'
										: 'bg-zinc text-muted-foreground',
							)}
						>
							adjective
						</span>
						<span className="text-muted-foreground/50">-</span>
						<span
							className={cn(
								'rounded-sm px-2 py-1',
								partValidation.color === true
									? 'bg-green/20 text-green'
									: partValidation.color === false
										? 'bg-red/20 text-red'
										: 'bg-zinc text-muted-foreground',
							)}
						>
							color
						</span>
						<span className="text-muted-foreground/50">-</span>
						<span
							className={cn(
								'rounded-sm px-2 py-1',
								partValidation.animal === true
									? 'bg-green/20 text-green'
									: partValidation.animal === false
										? 'bg-red/20 text-red'
										: 'bg-zinc text-muted-foreground',
							)}
						>
							animal
						</span>
					</div>
				</div>

				{/* Actions */}
				<div className="space-y-3">
					<Button
						variant="dark-accent"
						size="xl"
						className="w-full"
						onClick={handleJoin}
						disabled={!isComplete || isValidating || gameNotFound}
					>
						Join Game
						<ArrowRight className="ml-2 size-5" />
					</Button>
					<Button
						type="button"
						variant="dark-ghost"
						onClick={handleGoHome}
						className={`
							w-full text-muted-foreground
							hover:bg-zinc/50 hover:text-white
						`}
					>
						Back to Home
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
