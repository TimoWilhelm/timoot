import { useCallback, useMemo, useRef, useState } from 'react';

import { useViewTransitionNavigate } from '@/hooks/ui/use-view-transition-navigate';
import {
	adjectives,
	animals,
	colors,
	findMatches,
	generateRandomPlaceholder,
	getWordListForPosition,
	isValidGameId,
	isValidWord,
} from '@/lib/words';

export function useGameCode() {
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
	const wordInfo = getWordListForPosition(parts);
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

	return {
		value,
		setValue,
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
	};
}
