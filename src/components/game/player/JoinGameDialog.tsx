import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { adjectives, colors, animals, findMatches, isValidWord, isValidGameId } from '@/lib/words';
import { ArrowRight, Gamepad2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Determine which word list to use based on current position
function getWordListForPosition(parts: string[]): { list: string[]; label: string } | null {
	if (parts.length === 1) return { list: adjectives, label: 'Adjective' };
	if (parts.length === 2) return { list: colors, label: 'Color' };
	if (parts.length === 3) return { list: animals, label: 'Animal' };
	return null;
}

// Check if a partial word matches any word in the list
function getExactMatch(word: string, list: string[]): string | null {
	const match = list.find((w) => w.toLowerCase() === word.toLowerCase());
	return match || null;
}

export function JoinGameDialog() {
	const navigate = useNavigate();
	const [value, setValue] = useState('');
	const [showSuggestions, setShowSuggestions] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const parts = value.split('-');
	const currentPart = parts[parts.length - 1] || '';
	const wordInfo = getWordListForPosition(parts);
	const suggestions = useMemo(() => (wordInfo ? findMatches(currentPart, wordInfo.list).slice(0, 8) : []), [currentPart, wordInfo]);

	const isComplete = isValidGameId(value);

	// Validate each part for visual feedback
	const partValidation = {
		adjective: parts[0] ? isValidWord(parts[0], adjectives) : null,
		color: parts[1] ? isValidWord(parts[1], colors) : null,
		animal: parts[2] ? isValidWord(parts[2], animals) : null,
	};

	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		let newValue = e.target.value.toLowerCase();

		// Handle paste - clean up the value
		if (newValue.includes('-')) {
			// User pasted or typed a hyphen - validate and clean
			const pastedParts = newValue.split('-').filter(Boolean);
			newValue = pastedParts.join('-');
		}

		setValue(newValue);
		setShowSuggestions(true);
	}, []);

	const handleSelectSuggestion = useCallback(
		(suggestion: string) => {
			const newParts = [...parts];
			newParts[newParts.length - 1] = suggestion.toLowerCase();

			// Add hyphen if not at the last part (animal)
			if (newParts.length < 3) {
				setValue(newParts.join('-') + '-');
			} else {
				setValue(newParts.join('-'));
			}

			setShowSuggestions(true);
			inputRef.current?.focus();
		},
		[parts],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter') {
				if (isComplete) {
					navigate(`/play?gameId=${value}`);
				} else if (suggestions.length > 0) {
					// Auto-complete with first suggestion
					handleSelectSuggestion(suggestions[0]);
				}
			} else if (e.key === 'Tab' && suggestions.length > 0) {
				e.preventDefault();
				handleSelectSuggestion(suggestions[0]);
			} else if (e.key === 'Escape') {
				setShowSuggestions(false);
			}
		},
		[isComplete, value, suggestions, navigate, handleSelectSuggestion],
	);

	const handleJoin = () => {
		if (isComplete) {
			navigate(`/play?gameId=${value}`);
		}
	};

	const handleGoHome = () => {
		navigate('/');
	};

	// Auto-insert hyphen when a valid word is completed
	useEffect(() => {
		if (!currentPart || parts.length >= 3) return;

		const wordInfo = getWordListForPosition(parts);
		if (!wordInfo) return;

		const exactMatch = getExactMatch(currentPart, wordInfo.list);
		if (exactMatch && currentPart.length >= 3) {
			// Check if there's only one possible match - auto-complete
			const matches = findMatches(currentPart, wordInfo.list);
			if (matches.length === 1 && matches[0].toLowerCase() === currentPart.toLowerCase()) {
				// Perfect match, add hyphen
				if (parts.length < 3) {
					setValue((prev) => prev + '-');
				}
			}
		}
	}, [currentPart, parts]);

	return (
		<div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-800 text-white p-4">
			<div className="w-full max-w-md space-y-8 animate-fade-in">
				{/* Header */}
				<div className="text-center space-y-3">
					<div className="flex justify-center">
						<div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
							<Gamepad2 className="w-8 h-8 text-indigo-400" />
						</div>
					</div>
					<h1 className="text-3xl font-bold">Join Game</h1>
					<p className="text-slate-400 text-sm">Enter the game code shown on the host's screen</p>
				</div>

				{/* Game Code Input */}
				<div className="bg-slate-900/50 rounded-2xl p-6 space-y-4 border border-slate-700">
					<Popover open={showSuggestions && suggestions.length > 0 && !isComplete}>
						<PopoverAnchor asChild>
							<div className="relative">
								<input
									ref={inputRef}
									type="text"
									value={value}
									onChange={handleInputChange}
									onKeyDown={handleKeyDown}
									onFocus={() => setShowSuggestions(true)}
									onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
									placeholder="happy-blue-panda"
									autoFocus
									autoComplete="off"
									autoCorrect="off"
									autoCapitalize="off"
									spellCheck={false}
									className={cn(
										'w-full h-14 px-4 text-xl font-mono text-center rounded-xl',
										'bg-slate-700/50 border-2 border-slate-600',
										'text-white placeholder:text-slate-500',
										'focus:outline-none focus:border-indigo-500',
										'transition-colors',
										isComplete && 'border-green-500 bg-green-500/10',
									)}
								/>
								{isComplete && (
									<div className="absolute right-4 top-1/2 -translate-y-1/2">
										<Check className="h-5 w-5 text-green-400" />
									</div>
								)}
							</div>
						</PopoverAnchor>
						<PopoverContent
							className="w-[--radix-popover-trigger-width] p-0 bg-slate-800 border-slate-700"
							align="start"
							onOpenAutoFocus={(e) => e.preventDefault()}
						>
							<Command className="bg-transparent">
								<CommandList>
									<CommandEmpty className="text-slate-400 py-3 text-sm">No matches</CommandEmpty>
									<CommandGroup heading={wordInfo?.label}>
										{suggestions.map((word) => (
											<CommandItem
												key={word}
												value={word}
												onSelect={() => handleSelectSuggestion(word)}
												className="text-white hover:bg-slate-700 data-[selected=true]:bg-slate-700 cursor-pointer font-mono"
											>
												{word.toLowerCase()}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					{/* Validation hints */}
					<div className="flex justify-center gap-2 text-xs">
						<span
							className={cn(
								'px-2 py-1 rounded',
								partValidation.adjective === true
									? 'bg-green-500/20 text-green-400'
									: partValidation.adjective === false
										? 'bg-red-500/20 text-red-400'
										: 'bg-slate-700 text-slate-500',
							)}
						>
							adjective
						</span>
						<span className="text-slate-600">-</span>
						<span
							className={cn(
								'px-2 py-1 rounded',
								partValidation.color === true
									? 'bg-green-500/20 text-green-400'
									: partValidation.color === false
										? 'bg-red-500/20 text-red-400'
										: 'bg-slate-700 text-slate-500',
							)}
						>
							color
						</span>
						<span className="text-slate-600">-</span>
						<span
							className={cn(
								'px-2 py-1 rounded',
								partValidation.animal === true
									? 'bg-green-500/20 text-green-400'
									: partValidation.animal === false
										? 'bg-red-500/20 text-red-400'
										: 'bg-slate-700 text-slate-500',
							)}
						>
							animal
						</span>
					</div>
				</div>

				{/* Actions */}
				<div className="space-y-3">
					<Button
						onClick={handleJoin}
						disabled={!isComplete}
						className={cn(
							'w-full h-14 text-lg font-semibold rounded-xl transition-all',
							isComplete ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed',
						)}
					>
						Join Game
						<ArrowRight className="ml-2 h-5 w-5" />
					</Button>
					<Button variant="ghost" onClick={handleGoHome} className="w-full text-slate-400 hover:text-white hover:bg-slate-700/50">
						Back to Home
					</Button>
				</div>
			</div>
		</div>
	);
}
