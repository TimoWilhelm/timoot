import { useCallback, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { adjectives, animals, colors, findMatches, isValidGameId, isValidWord } from '@/lib/words';
import { cn } from '@/lib/utilities';
import { useViewTransitionNavigate } from '@/hooks/use-view-transition-navigate';

// Determine which word list to use based on current position
function getWordListForPosition(parts: string[]): { list: string[]; label: string } | undefined {
	if (parts.length === 1) return { list: adjectives, label: 'Adjective' };
	if (parts.length === 2) return { list: colors, label: 'Color' };
	if (parts.length === 3) return { list: animals, label: 'Animal' };
	return undefined;
}

// Generate a random placeholder example
function generateRandomPlaceholder(): string {
	const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)].toLowerCase();
	const randomColor = colors[Math.floor(Math.random() * colors.length)].toLowerCase();
	const randomAnimal = animals[Math.floor(Math.random() * animals.length)].toLowerCase();
	return `${randomAdj}-${randomColor}-${randomAnimal}`;
}

export function JoinGameDialog() {
	const navigate = useViewTransitionNavigate();
	const [value, setValue] = useState('');
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [autoCompleteFlash, setAutoCompleteFlash] = useState(false);
	const [showInvalidTooltip, setShowInvalidTooltip] = useState(false);
	const [errorMessage, setErrorMessage] = useState('Please check the game code');
	const [isValidating, setIsValidating] = useState(false);
	const [gameNotFound, setGameNotFound] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1); // -1 means nothing selected
	const [placeholder] = useState(generateRandomPlaceholder);
	const inputReference = useRef<HTMLInputElement>(null);
	const tooltipTimeoutReference = useRef<ReturnType<typeof setTimeout> | null>(null);

	const parts = value.split('-');
	const currentPart = parts.at(-1) || '';
	const partsCount = parts.length;
	const wordInfo = useMemo(() => getWordListForPosition(parts), [partsCount]); // eslint-disable-line react-hooks/exhaustive-deps
	const suggestions = useMemo(() => (wordInfo ? findMatches(currentPart, wordInfo.list).slice(0, 8) : []), [currentPart, wordInfo]);

	const isComplete = isValidGameId(value);

	// Validate each part for visual feedback
	const partValidation = {
		adjective: parts[0] ? isValidWord(parts[0], adjectives) : undefined,
		color: parts[1] ? isValidWord(parts[1], colors) : undefined,
		animal: parts[2] ? isValidWord(parts[2], animals) : undefined,
	};

	const showError = useCallback((message: string) => {
		// Clear any existing timeout
		if (tooltipTimeoutReference.current) {
			clearTimeout(tooltipTimeoutReference.current);
		}
		setErrorMessage(message);
		setShowInvalidTooltip(true);
		tooltipTimeoutReference.current = setTimeout(() => setShowInvalidTooltip(false), 3000);
	}, []);

	const showInvalidInput = useCallback(() => {
		showError('Please check the game code');
	}, [showError]);

	// Try to auto-complete when only one valid option remains
	// Returns the auto-completed value or undefined if no auto-complete should happen
	const tryAutoComplete = useCallback((inputValue: string): string | undefined => {
		const inputParts = inputValue.split('-');
		const inputCurrentPart = inputParts.at(-1) || '';

		if (!inputCurrentPart || inputCurrentPart.length < 2) return undefined;

		const inputWordInfo = getWordListForPosition(inputParts);
		if (!inputWordInfo) return undefined;

		const matches = findMatches(inputCurrentPart, inputWordInfo.list);

		// Auto-complete if there's exactly one match and user has typed enough
		if (matches.length === 1) {
			const match = matches[0].toLowerCase();
			// Only auto-complete if user hasn't already completed this word
			if (match !== inputCurrentPart.toLowerCase()) {
				const newParts = [...inputParts];
				newParts[newParts.length - 1] = match;

				// Add hyphen if not the last part (animal)
				return inputParts.length < 3 ? newParts.join('-') + '-' : newParts.join('-');
			} else if (inputParts.length < 3 && !inputValue.endsWith('-')) {
				// Word is complete, just add hyphen
				return inputValue + '-';
			}
		}
		return undefined;
	}, []);

	const handleInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			let newValue = event.target.value.toLowerCase();

			// Only allow letters a-z and hyphens (for paste)
			const filteredValue = newValue.replaceAll(/[^a-z-]/g, '');
			if (filteredValue !== newValue) {
				// Invalid characters were typed
				showInvalidInput();
				return;
			}
			newValue = filteredValue;

			// Handle paste - clean up the value
			if (newValue.includes('-')) {
				// User pasted or typed a hyphen - validate and clean
				const pastedParts = newValue.split('-').filter(Boolean);
				newValue = pastedParts.join('-');
			}

			// Check if this input would lead to any valid suggestions
			const newParts = newValue.split('-');
			const newCurrentPart = newParts.at(-1) || '';
			const newWordInfo = getWordListForPosition(newParts);

			if (newCurrentPart && newWordInfo) {
				const matches = findMatches(newCurrentPart, newWordInfo.list);
				if (matches.length === 0) {
					// No valid matches - block input and show tooltip
					showInvalidInput();
					return;
				}
			}

			// Auto-complete when only one valid option remains
			const autoCompleteResult = tryAutoComplete(newValue);
			if (autoCompleteResult) {
				setValue(autoCompleteResult);
				setAutoCompleteFlash(true);
				setTimeout(() => setAutoCompleteFlash(false), 300);
			} else {
				setValue(newValue);
			}

			// Reset UI state when input changes (moved from useEffect)
			setSelectedIndex(-1);
			setGameNotFound(false);
			setShowSuggestions(true);
			setShowInvalidTooltip(false);
		},
		[showInvalidInput, tryAutoComplete],
	);

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

			// Trigger flash animation
			setAutoCompleteFlash(true);
			setTimeout(() => setAutoCompleteFlash(false), 300);

			setShowSuggestions(true);
			inputReference.current?.focus();
		},
		[parts],
	);

	const handleJoin = useCallback(async () => {
		if (!isComplete || isValidating || gameNotFound) return;

		setIsValidating(true);
		try {
			const response = await fetch(`/api/games/${value}/exists`);
			if (response.ok) {
				navigate(`/play?gameId=${value}`);
			} else {
				setGameNotFound(true);
				showError('Game not found. Please check the code.');
			}
		} catch {
			showError('Could not verify game. Please try again.');
		} finally {
			setIsValidating(false);
		}
	}, [isComplete, isValidating, gameNotFound, value, navigate, showError]);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			// Allow Ctrl+A for select-all
			if (event.ctrlKey || event.metaKey) {
				return;
			}

			if (event.key === 'Enter') {
				if (isComplete) {
					void handleJoin();
				} else if (selectedIndex >= 0 && suggestions[selectedIndex]) {
					// Auto-complete with selected suggestion
					handleSelectSuggestion(suggestions[selectedIndex]);
				}
			} else if (event.key === 'Tab' && selectedIndex >= 0 && suggestions[selectedIndex]) {
				event.preventDefault();
				handleSelectSuggestion(suggestions[selectedIndex]);
			} else if (event.key === 'ArrowDown' && suggestions.length > 0) {
				event.preventDefault();
				setSelectedIndex((previous) => (previous + 1) % suggestions.length);
			} else if (event.key === 'ArrowUp' && suggestions.length > 0) {
				event.preventDefault();
				setSelectedIndex((previous) => (previous <= 0 ? suggestions.length - 1 : previous - 1));
			} else if (event.key === 'Escape') {
				setShowSuggestions(false);
			} else if (event.key === 'Backspace') {
				const input = event.currentTarget;
				const hasSelection = input.selectionStart !== input.selectionEnd;

				// If text is selected (e.g., after Ctrl+A), allow normal deletion
				if (hasSelection) {
					return;
				}

				// Check if current part is a completed word or empty (ends with hyphen)
				const endsWithHyphen = value.endsWith('-');
				const isCurrentPartComplete = endsWithHyphen || (wordInfo && currentPart && isValidWord(currentPart, wordInfo.list));

				if (isCurrentPartComplete) {
					// Delete the whole word
					event.preventDefault();

					// If ends with hyphen, we need to find the hyphen BEFORE the trailing one
					const searchValue = endsWithHyphen ? value.slice(0, -1) : value;
					const lastHyphenIndex = searchValue.lastIndexOf('-');

					if (lastHyphenIndex === -1) {
						// No hyphen (single complete word), clear everything
						setValue('');
					} else {
						// "happy-blue-panda" -> "happy-blue-", "happy-blue-" -> "happy-", "happy-" -> ""
						setValue(searchValue.slice(0, lastHyphenIndex + 1));
					}
				}
				// Otherwise, let default backspace behavior work (delete one char)
			} else if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
				// Prevent cursor movement (but not when selecting)
				event.preventDefault();
			}
		},
		[isComplete, value, suggestions, handleJoin, handleSelectSuggestion, wordInfo, currentPart, selectedIndex],
	);

	// Keep cursor at end of input (but allow full selection)
	const handleSelect = useCallback((event: React.SyntheticEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		// Allow full selection (Ctrl+A), otherwise force cursor to end
		const isFullSelection = input.selectionStart === 0 && input.selectionEnd === input.value.length;
		if (!isFullSelection && (input.selectionStart !== input.value.length || input.selectionEnd !== input.value.length)) {
			input.setSelectionRange(input.value.length, input.value.length);
		}
	}, []);

	const handleGoHome = () => {
		navigate('/');
	};

	return (
		<div
			className={`
				flex min-h-screen w-full flex-col items-center justify-center bg-black p-4
				text-white
			`}
		>
			<div className="w-full max-w-md animate-fade-in space-y-8">
				{/* Header */}
				<div className="space-y-3 text-center">
					<div className="flex justify-center">
						<div
							className={`
								flex size-16 items-center justify-center rounded-xl border-4
								border-white/20 bg-orange shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]
							`}
						>
							<Gamepad2 className="size-8 text-white" />
						</div>
					</div>
					<h1 className="font-display text-3xl font-black uppercase">Join Game</h1>
					<p className="text-sm text-muted-foreground">Enter the game code shown on the host's screen</p>
				</div>

				{/* Game Code Input */}
				<div
					className={`
						space-y-4 rounded-2xl border border-white/10 bg-slate/50 p-6
						focus-within:outline-2 focus-within:outline-white
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
										'border-2 border-white/20 bg-slate/50',
										`
											text-white
											placeholder:text-muted-foreground/50
										`,
										'focus:outline-none',
										'transition-all duration-200',
										isComplete && 'border-green bg-green/10',
										autoCompleteFlash && 'border-orange bg-orange/20',
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
								w-(--radix-popover-trigger-width) border-white/10 bg-black p-0
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
											index === selectedIndex ? 'bg-slate' : 'hover:bg-slate/50',
										)}
									>
										{word.toLowerCase()}
									</div>
								))}
							</div>
						</PopoverContent>
					</Popover>

					{/* Validation hints */}
					<div className="flex justify-center gap-2 text-xs">
						<span
							className={cn(
								'rounded-sm px-2 py-1',
								partValidation.adjective === true
									? 'bg-green/20 text-green'
									: partValidation.adjective === false
										? 'bg-red/20 text-red'
										: 'bg-slate text-muted-foreground',
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
										: 'bg-slate text-muted-foreground',
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
										: 'bg-slate text-muted-foreground',
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
						disabled={!isComplete || isValidating || gameNotFound}
						className={cn(
							'h-14 w-full rounded-xl text-lg font-semibold transition-all',
							isComplete && !isValidating && !gameNotFound
								? `
									bg-orange text-white
									hover:bg-orange/80
								`
								: 'cursor-not-allowed bg-slate text-muted-foreground',
						)}
					>
						Join Game
						<ArrowRight className="ml-2 size-5" />
					</Button>
					<Button
						variant="ghost"
						onClick={handleGoHome}
						className={`
							w-full text-muted-foreground
							hover:bg-slate/50 hover:text-white
						`}
					>
						Back to Home
					</Button>
				</div>
			</div>
		</div>
	);
}
