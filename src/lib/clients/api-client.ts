/**
 * API Client utilities for type-safe API access.
 *
 * Use React Query hooks from `@/hooks/use-api` for all API calls:
 *
 * @example
 * ```tsx
 * import { useMyQuery, useMyMutation } from '@/hooks/use-api';
 *
 * // Queries
 * const { data, isLoading } = useMyQuery();
 *
 * // Mutations
 * const mutation = useMyMutation();
 * mutation.mutate({ ... });
 * ```
 */

import { hc } from 'hono/client';

import type { ApiRoutes } from '@server/routes/user-routes';

export type { InferRequestType, InferResponseType } from 'hono/client';

/**
 * Pre-compiled client type for better IDE performance.
 * @see https://hono.dev/docs/guides/rpc#typescript-project-references
 */
export type Client = ReturnType<typeof hc<ApiRoutes>>;

export const hcWithType = (...arguments_: Parameters<typeof hc>): Client => hc<ApiRoutes>(...arguments_);
