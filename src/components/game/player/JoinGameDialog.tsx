import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { adjectives, colors, animals, findMatches, isValidWord, isValidGameId } from '@/lib/words';
import { ArrowRight, Gamepad2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Determine which word list to use based on current position
function getWordListForPosition(parts: string[]): { list: string[]; label: string } | null {
	if (parts.length === 1) return { list: adjectives, label: 'Adjective' };
	if (parts.length === 2) return { list: colors, label: 'Color' };
	if (parts.length === 3) return { list: animals, label: 'Animal' };
	return null;
}

// Generate a random placeholder example
function generateRandomPlaceholder(): string {
	const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)].toLowerCase();
	const randomColor = colors[Math.floor(Math.random() * colors.length)].toLowerCase();
	const randomAnimal = animals[Math.floor(Math.random() * animals.length)].toLowerCase();
	return `${randomAdj}-${randomColor}-${randomAnimal}`;
}

export function JoinGameDialog() {
	const navigate = useNavigate();
	const [value, setValue] = useState('');
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [autoCompleteFlash, setAutoCompleteFlash] = useState(false);
	const [showInvalidTooltip, setShowInvalidTooltip] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1); // -1 means nothing selected
	const [placeholder] = useState(generateRandomPlaceholder);
	const inputRef = useRef<HTMLInputElement>(null);
	const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const parts = value.split('-');
	const currentPart = parts[parts.length - 1] || '';
	const partsCount = parts.length;
	const wordInfo = useMemo(() => getWordListForPosition(parts), [partsCount]); // eslint-disable-line react-hooks/exhaustive-deps
	const suggestions = useMemo(() => (wordInfo ? findMatches(currentPart, wordInfo.list).slice(0, 8) : []), [currentPart, wordInfo]);

	// Reset selection when user types (currentPart changes)
	useEffect(() => {
		setSelectedIndex(-1);
	}, [currentPart]);

	const isComplete = isValidGameId(value);

	// Validate each part for visual feedback
	const partValidation = {
		adjective: parts[0] ? isValidWord(parts[0], adjectives) : null,
		color: parts[1] ? isValidWord(parts[1], colors) : null,
		animal: parts[2] ? isValidWord(parts[2], animals) : null,
	};

	const showInvalidInput = useCallback(() => {
		// Clear any existing timeout
		if (tooltipTimeoutRef.current) {
			clearTimeout(tooltipTimeoutRef.current);
		}
		setShowInvalidTooltip(true);
		tooltipTimeoutRef.current = setTimeout(() => setShowInvalidTooltip(false), 2000);
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			let newValue = e.target.value.toLowerCase();

			// Only allow letters a-z and hyphens (for paste)
			const filteredValue = newValue.replace(/[^a-z-]/g, '');
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
			const newCurrentPart = newParts[newParts.length - 1] || '';
			const newWordInfo = getWordListForPosition(newParts);

			if (newCurrentPart && newWordInfo) {
				const matches = findMatches(newCurrentPart, newWordInfo.list);
				if (matches.length === 0) {
					// No valid matches - block input and show tooltip
					showInvalidInput();
					return;
				}
			}

			setValue(newValue);
			setShowSuggestions(true);
			// Hide invalid tooltip when valid input is entered
			setShowInvalidTooltip(false);
		},
		[showInvalidInput],
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
			inputRef.current?.focus();
		},
		[parts],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			// Allow Ctrl+A for select-all
			if (e.ctrlKey || e.metaKey) {
				return;
			}

			if (e.key === 'Enter') {
				if (isComplete) {
					navigate(`/play?gameId=${value}`);
				} else if (selectedIndex >= 0 && suggestions[selectedIndex]) {
					// Auto-complete with selected suggestion
					handleSelectSuggestion(suggestions[selectedIndex]);
				}
			} else if (e.key === 'Tab' && selectedIndex >= 0 && suggestions[selectedIndex]) {
				e.preventDefault();
				handleSelectSuggestion(suggestions[selectedIndex]);
			} else if (e.key === 'ArrowDown' && suggestions.length > 0) {
				e.preventDefault();
				setSelectedIndex((prev) => (prev + 1) % suggestions.length);
			} else if (e.key === 'ArrowUp' && suggestions.length > 0) {
				e.preventDefault();
				setSelectedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
			} else if (e.key === 'Escape') {
				setShowSuggestions(false);
			} else if (e.key === 'Backspace') {
				const input = e.currentTarget;
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
					e.preventDefault();

					// If ends with hyphen, we need to find the hyphen BEFORE the trailing one
					const searchValue = endsWithHyphen ? value.slice(0, -1) : value;
					const lastHyphenIndex = searchValue.lastIndexOf('-');

					if (lastHyphenIndex >= 0) {
						// "happy-blue-panda" -> "happy-blue-", "happy-blue-" -> "happy-", "happy-" -> ""
						setValue(searchValue.slice(0, lastHyphenIndex + 1));
					} else {
						// No hyphen (single complete word), clear everything
						setValue('');
					}
				}
				// Otherwise, let default backspace behavior work (delete one char)
			} else if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
				// Prevent cursor movement (but not when selecting)
				e.preventDefault();
			}
		},
		[isComplete, value, suggestions, navigate, handleSelectSuggestion, wordInfo, currentPart, selectedIndex],
	);

	// Keep cursor at end of input (but allow full selection)
	const handleSelect = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
		const input = e.currentTarget;
		// Allow full selection (Ctrl+A), otherwise force cursor to end
		const isFullSelection = input.selectionStart === 0 && input.selectionEnd === input.value.length;
		if (!isFullSelection && (input.selectionStart !== input.value.length || input.selectionEnd !== input.value.length)) {
			input.setSelectionRange(input.value.length, input.value.length);
		}
	}, []);

	const handleJoin = () => {
		if (isComplete) {
			navigate(`/play?gameId=${value}`);
		}
	};

	const handleGoHome = () => {
		navigate('/');
	};

	// Auto-complete when only one valid option remains
	useEffect(() => {
		if (!currentPart || currentPart.length < 2) return;

		const wordInfo = getWordListForPosition(parts);
		if (!wordInfo) return;

		const matches = findMatches(currentPart, wordInfo.list);

		// Auto-complete if there's exactly one match and user has typed enough
		if (matches.length === 1) {
			const match = matches[0].toLowerCase();
			// Only auto-complete if user hasn't already completed this word
			if (match !== currentPart.toLowerCase()) {
				const newParts = [...parts];
				newParts[newParts.length - 1] = match;

				// Add hyphen if not the last part (animal)
				if (parts.length < 3) {
					setValue(newParts.join('-') + '-');
				} else {
					setValue(newParts.join('-'));
				}

				// Trigger flash animation
				setAutoCompleteFlash(true);
				setTimeout(() => setAutoCompleteFlash(false), 300);
			} else if (parts.length < 3 && !value.endsWith('-')) {
				// Word is complete, just add hyphen
				setValue((prev) => prev + '-');
			}
		}
	}, [currentPart, parts, value]);

	return (
		<div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-800 p-4 text-white">
			<div className="w-full max-w-md animate-fade-in space-y-8">
				{/* Header */}
				<div className="space-y-3 text-center">
					<div className="flex justify-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20">
							<Gamepad2 className="h-8 w-8 text-indigo-400" />
						</div>
					</div>
					<h1 className="text-3xl font-bold">Join Game</h1>
					<p className="text-sm text-slate-400">Enter the game code shown on the host's screen</p>
				</div>

				{/* Game Code Input */}
				<div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
					<Popover open={showSuggestions && suggestions.length > 0 && !isComplete}>
						<PopoverAnchor asChild>
							<div className="relative">
								<input
									ref={inputRef}
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
										'border-2 border-slate-600 bg-slate-700/50',
										'text-white placeholder:text-slate-500',
										'focus:border-indigo-500 focus:outline-none',
										'transition-all duration-200',
										isComplete && 'border-green-500 bg-green-500/10',
										autoCompleteFlash && 'border-indigo-400 bg-indigo-500/20',
										showInvalidTooltip && 'border-red-500 bg-red-500/10',
									)}
								/>
								{isComplete && (
									<div className="absolute right-4 top-1/2 -translate-y-1/2">
										<Check className="h-5 w-5 text-green-400" />
									</div>
								)}
								{/* Invalid input tooltip - positioned above */}
								<div
									className={cn(
										'absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg px-3 py-2',
										'border border-red-700 bg-red-900/90 text-sm text-red-200',
										'flex items-center gap-2 whitespace-nowrap',
										'transition-all duration-200',
										showInvalidTooltip ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
									)}
								>
									<AlertCircle className="h-4 w-4" />
									Please check the game code
								</div>
							</div>
						</PopoverAnchor>
						<PopoverContent
							className="w-[--radix-popover-trigger-width] border-slate-700 bg-slate-800 p-0"
							align="start"
							onOpenAutoFocus={(e) => e.preventDefault()}
						>
							<div className="py-1">
								<div className="px-2 py-1.5 text-xs font-medium text-slate-400">{wordInfo?.label}</div>
								{suggestions.map((word, index) => (
									<div
										key={word}
										onClick={() => handleSelectSuggestion(word)}
										className={cn(
											'mx-1 cursor-pointer rounded-sm px-2 py-1.5 font-mono text-sm text-white',
											index === selectedIndex ? 'bg-slate-700' : 'hover:bg-slate-700/50',
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
								'rounded px-2 py-1',
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
								'rounded px-2 py-1',
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
								'rounded px-2 py-1',
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
							'h-14 w-full rounded-xl text-lg font-semibold transition-all',
							isComplete ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'cursor-not-allowed bg-slate-700 text-slate-500',
						)}
					>
						Join Game
						<ArrowRight className="ml-2 h-5 w-5" />
					</Button>
					<Button variant="ghost" onClick={handleGoHome} className="w-full text-slate-400 hover:bg-slate-700/50 hover:text-white">
						Back to Home
					</Button>
				</div>
			</div>
		</div>
	);
}
