import { hc } from 'hono/client';
import type { ApiRoutes } from '../../dist/worker/worker/user-routes';

/**
 * Type-safe Hono RPC client for API calls.
 * Uses hcWithType pattern for better type inference at compile time.
 */
// Pre-compute client type at compile time for better type inference
export type Client = ReturnType<typeof hc<ApiRoutes>>;
const hcWithType = (...arguments_: Parameters<typeof hc>): Client => hc<ApiRoutes>(...arguments_);
export const client = hcWithType('/');

/**
 * Type for inferring request/response types from the API client.
 */
export type { InferRequestType, InferResponseType } from 'hono/client';
