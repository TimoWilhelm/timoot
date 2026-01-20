import { createContext, useCallback, useContext, useId, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utilities';

// ============================================================================
// Types
// ============================================================================

type ValidationMode = 'numeric' | 'alphanumeric';

interface OTPContextValue {
	value: string;
	length: number;
	disabled: boolean;
	validationMode: ValidationMode;
	name?: string;
	autoSubmit: boolean;
	groupId: string;
	registerInput: (index: number, element: HTMLInputElement | undefined) => void;
	getInputReference: (index: number) => HTMLInputElement | undefined;
	handleChange: (index: number, inputValue: string) => void;
	handleKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void;
	handlePaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
	handleFocus: (index: number) => void;
	currentInputIndex: number;
}

interface RootProperties {
	children: React.ReactNode;
	/** Number of OTP characters */
	length?: number;
	/** Field name for form submission */
	name?: string;
	/** Callback when value changes */
	onValueChange?: (value: string) => void;
	/** Callback when all characters are entered */
	onComplete?: (value: string) => void;
	/** Auto-submit the form when complete */
	autoSubmit?: boolean;
	/** Disable all inputs */
	disabled?: boolean;
	/** Validation mode: 'numeric' or 'alphanumeric' */
	validationMode?: ValidationMode;
	/** Additional class names for the container */
	className?: string;
	/** Default value */
	defaultValue?: string;
}

interface InputProperties {
	/** Index of this input (required) */
	index: number;
	/** Additional class names */
	className?: string;
}

interface HiddenInputProperties {
	/** Override the name from Root */
	name?: string;
}

// ============================================================================
// Context
// ============================================================================

const OTPContext = createContext<OTPContextValue | undefined>(undefined);

function useOTPContext() {
	const context = useContext(OTPContext);
	if (!context) {
		throw new Error('OTP components must be used within OneTimePasswordField.Root');
	}
	return context;
}

// ============================================================================
// Validation
// ============================================================================

function validateChar(char: string, mode: ValidationMode): boolean {
	if (mode === 'numeric') {
		return /^\d$/.test(char);
	}
	return /^[\dA-Za-z]$/.test(char);
}

function sanitizeValue(value: string, mode: ValidationMode): string {
	if (mode === 'numeric') {
		return value.replaceAll(/\D/g, '');
	}
	return value.replaceAll(/[^\dA-Za-z]/g, '').toUpperCase();
}

// ============================================================================
// Root Component
// ============================================================================

const inputClassName = `
	aspect-square size-12 grow rounded-lg border-2 border-black bg-white
	text-center font-mono text-xl font-bold uppercase shadow-brutal-inset
	ring-0 ring-transparent ring-offset-0
	transition-all duration-300 ease-spring
	placeholder:text-muted-foreground/50
	focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-hidden
	disabled:cursor-not-allowed disabled:opacity-50
	selection:bg-black selection:text-white
`;

export function Root({
	children,
	length = 6,
	name,
	onValueChange,
	onComplete,
	autoSubmit = false,
	disabled = false,
	validationMode = 'alphanumeric',
	className,
	defaultValue = '',
}: RootProperties) {
	const groupId = useId();
	const inputReferences = useRef<(HTMLInputElement | undefined)[]>([]);
	const [value, setValue] = useState(() => sanitizeValue(defaultValue, validationMode).slice(0, length));
	const [currentInputIndex, setCurrentInputIndex] = useState(0);
	const formReference = useRef<HTMLFormElement | undefined>(undefined);

	const registerInput = useCallback((index: number, element: HTMLInputElement | undefined) => {
		inputReferences.current[index] = element;
		// Find the parent form for auto-submit
		if (element && !formReference.current) {
			formReference.current = element.closest('form') ?? undefined;
		}
	}, []);

	const getInputReference = useCallback((index: number) => inputReferences.current[index], []);

	const updateValue = useCallback(
		(newValue: string) => {
			setValue(newValue);
			onValueChange?.(newValue);

			if (newValue.length === length) {
				onComplete?.(newValue);

				if (autoSubmit && formReference.current) {
					// Use requestSubmit for proper form validation
					formReference.current.requestSubmit();
				}
			}
		},
		[length, onValueChange, onComplete, autoSubmit],
	);

	const handleChange = useCallback(
		(index: number, inputValue: string) => {
			const sanitized = sanitizeValue(inputValue, validationMode);

			// Handle paste/autofill (multiple characters)
			if (sanitized.length > 1) {
				const oldValue = value[index] || '';
				// Detect single char addition to existing value (Overwrite behavior)
				const isOverwrite = oldValue && sanitized.length === 2 && sanitized.includes(oldValue);

				if (!isOverwrite) {
					// Paste/Distribution behavior
					const chars = [...value];
					const sanitizedChars = [...sanitized];

					for (const [offset, char] of sanitizedChars.entries()) {
						if (index + offset < length) {
							chars[index + offset] = char;
						}
					}

					const newValue = chars.join('').slice(0, length);
					updateValue(newValue);

					// Update all inputs manually to ensure sync
					for (let inputIndex = 0; inputIndex < length; inputIndex++) {
						const input = inputReferences.current[inputIndex];
						if (input) {
							input.value = newValue[inputIndex] || '';
						}
					}

					// Focus appropriate input
					const nextIndex = Math.min(index + sanitized.length, length - 1);
					inputReferences.current[nextIndex]?.focus();
					return;
				}
			}

			// Single character behavior (Type/Overwrite)
			const char = inputValue.slice(-1);

			if (char && !validateChar(char, validationMode)) {
				// Invalid character - reset input to current value
				const input = inputReferences.current[index];
				if (input) {
					input.value = value[index] || '';
				}
				return;
			}

			const normalizedChar = validationMode === 'alphanumeric' ? char.toUpperCase() : char;

			// Build new value
			const chars = [...value];
			chars[index] = normalizedChar;
			const newValue = chars.join('').slice(0, length);

			updateValue(newValue);

			// Update input display
			const input = inputReferences.current[index];
			if (input) {
				input.value = normalizedChar;
			}

			// Move to next input if character was entered
			if (normalizedChar && index < length - 1) {
				inputReferences.current[index + 1]?.focus();
			}
		},
		[value, length, validationMode, updateValue],
	);

	const handleKeyDown = useCallback(
		(index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
			const input = inputReferences.current[index];
			if (!input) return;

			switch (event.key) {
				case 'Backspace': {
					event.preventDefault();
					const chars = [...value];

					if (value[index]) {
						// Clear current character
						chars[index] = '';
						updateValue(chars.join(''));
						input.value = '';
					} else if (index > 0) {
						// Move to previous and clear it
						const previousInput = inputReferences.current[index - 1];
						if (previousInput) {
							chars[index - 1] = '';
							updateValue(chars.join(''));
							previousInput.value = '';
							previousInput.focus();
						}
					}
					break;
				}
				case 'Delete': {
					event.preventDefault();
					if (value[index]) {
						const chars = [...value];
						chars[index] = '';
						updateValue(chars.join(''));
						input.value = '';
					}
					break;
				}
				case 'ArrowLeft': {
					event.preventDefault();
					if (index > 0) {
						inputReferences.current[index - 1]?.focus();
					}
					break;
				}
				case 'ArrowRight': {
					event.preventDefault();
					if (index < length - 1) {
						inputReferences.current[index + 1]?.focus();
					}
					break;
				}
				case 'Home': {
					event.preventDefault();
					inputReferences.current[0]?.focus();
					break;
				}
				case 'End': {
					event.preventDefault();
					inputReferences.current[length - 1]?.focus();
					break;
				}
			}
		},
		[value, length, updateValue],
	);

	const handlePaste = useCallback(
		(event: React.ClipboardEvent<HTMLInputElement>) => {
			event.preventDefault();
			const pastedData = sanitizeValue(event.clipboardData.getData('text'), validationMode);
			const newValue = pastedData.slice(0, length);

			// Update all inputs
			for (let index = 0; index < length; index++) {
				const input = inputReferences.current[index];
				if (input) {
					input.value = newValue[index] || '';
				}
			}

			updateValue(newValue);

			// Focus appropriate input
			if (newValue.length >= length) {
				inputReferences.current[length - 1]?.focus();
			} else {
				inputReferences.current[newValue.length]?.focus();
			}
		},
		[length, validationMode, updateValue],
	);

	const handleFocus = useCallback((index: number) => {
		setCurrentInputIndex(index);
		// Select content on focus for easy replacement
		const input = inputReferences.current[index];
		if (input) {
			input.select();
		}
	}, []);

	const contextValue = useMemo<OTPContextValue>(
		() => ({
			value,
			length,
			disabled,
			validationMode,
			name,
			autoSubmit,
			groupId,
			registerInput,
			getInputReference,
			handleChange,
			handleKeyDown,
			handlePaste,
			handleFocus,
			currentInputIndex,
		}),
		[
			value,
			length,
			disabled,
			validationMode,
			name,
			autoSubmit,
			groupId,
			registerInput,
			getInputReference,
			handleChange,
			handleKeyDown,
			handlePaste,
			handleFocus,
			currentInputIndex,
		],
	);

	return (
		<OTPContext.Provider value={contextValue}>
			<div
				role="group"
				aria-label="One-time password"
				aria-describedby={`${groupId}-description`}
				className={cn('flex items-center gap-2', className)}
			>
				<span id={`${groupId}-description`} className="sr-only">
					Enter the {length}-character code. Use arrow keys to navigate between inputs.
				</span>
				{children}
			</div>
		</OTPContext.Provider>
	);
}

// ============================================================================
// Input Component
// ============================================================================

export function Input({ index, className }: InputProperties) {
	const { value, length, disabled, validationMode, groupId, registerInput, handleChange, handleKeyDown, handlePaste, handleFocus } =
		useOTPContext();

	const charValue = value[index] || '';

	return (
		<input
			ref={(element) => registerInput(index, element ?? undefined)}
			type="text"
			inputMode={validationMode === 'numeric' ? 'numeric' : 'text'}
			maxLength={length}
			disabled={disabled}
			defaultValue={charValue}
			aria-label={`Character ${index + 1} of ${length}`}
			aria-describedby={`${groupId}-description`}
			className={cn(inputClassName, className)}
			onChange={(event) => handleChange(index, event.target.value)}
			onKeyDown={(event) => handleKeyDown(index, event)}
			onPaste={handlePaste}
			onFocus={() => handleFocus(index)}
			autoComplete={index === 0 ? 'one-time-code' : 'off'}
		/>
	);
}

// ============================================================================
// Hidden Input Component
// ============================================================================

export function HiddenInput({ name: overrideName }: HiddenInputProperties) {
	const { value, name: contextName } = useOTPContext();
	const fieldName = overrideName ?? contextName;

	if (!fieldName) {
		console.warn('OneTimePasswordField.HiddenInput: No name provided. Use the name prop on Root or HiddenInput.');
		return;
	}

	return <input type="hidden" name={fieldName} value={value} />;
}
