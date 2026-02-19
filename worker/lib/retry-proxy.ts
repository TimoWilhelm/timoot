/**
 * Transparent retry proxy for Durable Objects.
 *
 * Wraps a DurableObjectNamespace to automatically retry failed RPC calls
 * with exponential backoff and jitter. Creates a fresh stub on each retry
 * since exceptions can leave stubs in a "broken" state.
 *
 * @see https://developers.cloudflare.com/durable-objects/best-practices/error-handling/
 * @see https://github.com/TimoWilhelm/do-retry-proxy
 */

export interface RetryOptions {
	/** Maximum number of retry attempts (default: 3) */
	maxAttempts?: number;
	/** Base delay in milliseconds for exponential backoff (default: 100) */
	baseDelayMs?: number;
	/** Maximum delay in milliseconds (default: 3000) */
	maxDelayMs?: number;
	/** Custom function to determine if an error is retryable */
	isRetryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'isRetryable'>> = {
	maxAttempts: 3,
	baseDelayMs: 100,
	maxDelayMs: 3000,
};

interface DurableObjectError {
	retryable?: boolean;
	overloaded?: boolean;
}

function isDurableObjectError(error: unknown): error is DurableObjectError {
	return typeof error === 'object' && error !== null;
}

/**
 * Returns true if the error is retryable according to Durable Object error handling best practices.
 * - `.retryable` must be true
 * - `.overloaded` must NOT be true (retrying would worsen the overload)
 */
function isErrorRetryable(error: unknown): boolean {
	if (!isDurableObjectError(error)) {
		return false;
	}
	const message = String(error);
	return Boolean(error.retryable) && !error.overloaded && !message.includes('Durable Object is overloaded');
}

/**
 * Calculates jittered exponential backoff delay.
 * Uses the "Full Jitter" approach from AWS.
 * @see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */
function jitterBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
	const attemptUpperBoundMs = Math.min(2 ** attempt * baseDelayMs, maxDelayMs);
	return Math.floor(Math.random() * attemptUpperBoundMs);
}

type StubGetter<T extends Rpc.DurableObjectBranded> = () => DurableObjectStub<T>;

type ResolvedRetryOptions = Required<Omit<RetryOptions, 'isRetryable'>> & { isRetryable?: (error: unknown) => boolean };

/**
 * Creates a proxy around a DurableObjectStub that retries failed RPC calls.
 * On each retry, a fresh stub is obtained via the getter function.
 */
function createStubProxy<T extends Rpc.DurableObjectBranded>(getStub: StubGetter<T>, options: ResolvedRetryOptions): DurableObjectStub<T> {
	const stub = getStub();

	return new Proxy(stub, {
		get(target, property) {
			const value = Reflect.get(target, property, target);

			// Only intercept function calls (RPC methods)
			if (typeof value !== 'function') {
				return value;
			}

			// Don't wrap internal properties
			if (typeof property === 'symbol') {
				return value;
			}

			// Don't wrap fetch() — it's used for WebSocket upgrades (101 Switching Protocols)
			// which are not idempotent and must never be retried.
			if (property === 'fetch') {
				return value.bind(target);
			}

			return async (...arguments_: unknown[]) => {
				let attempt = 1;
				let lastError: unknown;
				let currentStub = target;

				while (attempt <= options.maxAttempts) {
					try {
						// On the first attempt, we use the initial stub (target).
						// On subsequent attempts, currentStub is updated to a fresh stub.
						const rpcMethod: unknown = Reflect.get(currentStub, property, currentStub);
						if (typeof rpcMethod !== 'function') {
							return rpcMethod;
						}
						return await rpcMethod(...arguments_);
					} catch (error) {
						lastError = error;

						// Check if we should retry
						// 1. Always retry infrastructure errors (unless overloaded)
						if (isErrorRetryable(error)) {
							// continue to retry logic
						}
						// 2. Check custom predicate if provided
						else if (options.isRetryable?.(error)) {
							// continue to retry logic
						} else {
							throw error;
						}

						// Check if we've exhausted attempts
						if (attempt >= options.maxAttempts) {
							break;
						}

						// Always create a fresh stub for the next attempt.
						// Many exceptions leave the stub in a "broken" state.
						// Even for application errors (.remote = true), it is safer and cheap to recreate.
						currentStub = getStub();

						// Calculate backoff and wait
						const delay = jitterBackoff(attempt, options.baseDelayMs, options.maxDelayMs);
						await scheduler.wait(delay);

						attempt++;
					}
				}

				throw lastError;
			};
		},
	});
}

/**
 * Wraps a DurableObjectNamespace with automatic retry capabilities.
 *
 * The returned namespace is fully transparent - use it exactly like the original.
 * All RPC method calls on stubs obtained from this namespace will automatically
 * retry on transient failures with exponential backoff.
 *
 * @example
 * ```ts
 * const namespace = withRetry(exports.MyDurableObject);
 * const stub = namespace.getByName('foo');
 * const result = await stub.someMethod(); // Automatically retries on failure
 * ```
 */
export function withRetry<T extends Rpc.DurableObjectBranded>(
	namespace: DurableObjectNamespace<T>,
	options?: RetryOptions,
): DurableObjectNamespace<T> {
	const resolvedOptions: ResolvedRetryOptions = {
		...DEFAULT_OPTIONS,
		...options,
		isRetryable: options?.isRetryable,
	};

	return new Proxy(namespace, {
		get(target, property, receiver) {
			const value = Reflect.get(target, property, receiver);

			if (typeof value !== 'function') {
				return value;
			}

			// Intercept methods that return a stub
			if (property === 'get') {
				return (id: DurableObjectId) => {
					const getStub = () => target.get(id);
					return createStubProxy(getStub, resolvedOptions);
				};
			}

			// Handle getByName (convenience method that creates stub by name)
			if (property === 'getByName') {
				return (name: string, getOptions?: DurableObjectGetOptions) => {
					const getStub = () => {
						const getByNameFunction: unknown = Reflect.get(target, 'getByName', target);
						if (typeof getByNameFunction !== 'function') {
							throw new TypeError('getByName is not available on this namespace');
						}
						// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Reflect.get returns unknown, safe cast after typeof check
						return getByNameFunction(name, getOptions) as DurableObjectStub<T>;
					};
					return createStubProxy(getStub, resolvedOptions);
				};
			}

			// For jurisdiction-specific namespace
			if (property === 'jurisdiction') {
				return (jurisdiction: DurableObjectJurisdiction) => {
					const jurisdictionNamespace = target.jurisdiction(jurisdiction);
					return withRetry(jurisdictionNamespace, options);
				};
			}

			// Return other methods as-is (idFromName, idFromString, newUniqueId)
			return value.bind(target);
		},
	});
}
