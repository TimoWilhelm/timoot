# Coding Conventions

<file_naming>
- All file names must use kebab-case (e.g., `my-component.tsx`, `api-client.ts`)
</file_naming>

<code_style>
- Use TypeScript for all code
- Use early returns when possible
- Follow existing code patterns in the codebase
</code_style>

<react_best_practices>
- If you can calculate something during render, you don't need an Effect.
- To cache expensive calculations, add useMemo instead of useEffect.
- To reset the state of an entire component tree, pass a different key to it.
- To reset a particular bit of state in response to a prop change, set it during rendering.
- Code that runs because a component was displayed should be in Effects, the rest should be in events.
- If you need to update the state of several components, it's better to do it during a single event.
- Whenever you try to synchronize state variables in different components, consider lifting state up.
- You can fetch data with Effects, but you need to implement cleanup to avoid race conditions.
</react_best_practices>


# Project Structure

<directories>
- `src/` - React app (pages, components, hooks)
- `worker/` - Cloudflare Worker (API routes, Durable Objects)
- `shared/` - Shared code between frontend and worker
- `test/` - Unit, integration and end-to-end tests
- `.storybook/` - Storybook configuration
</directories>

<api_client>
- Use React Query hooks from `@/hooks/use-api` for all API calls
- Hono RPC client provides type-safe request/response types
- React Query handles caching, loading states, and cache invalidation
- Documentation: <https://tanstack.com/query/latest>, <https://hono.dev/docs/guides/rpc>
</api_client>


# Tech Stack

<frontend>
- React with TypeScript
- TanStack React Query for server state management
- Tailwind CSS for styling
- Zustand for client state management
- Framer Motion for animations
</frontend>

<backend>
- Cloudflare Workers with Hono framework
- Cloudflare Durable Objects for real-time features
- WebSockets for real-time communication
- Durable Objects SQLite and KV for storage
</backend>

<build_and_tooling>
- Package manager: bun (use bun commands, not npm/yarn/pnpm)
- Build tool: Vite with @cloudflare/vite-plugin
- Dev server: bun dev (runs at localhost:3000)
- Install all dependencies as dev dependencies (`bun add -d`) since they are bundled with Vite
</build_and_tooling>


# Testing & Quality

<testing>
- Unit tests: Vitest (`bun test`)
- Integration tests: Vitest (`bun test:integration`)
- Component tests: Storybook (`bun test:storybook`)
- E2E tests: Playwright (`bun test:e2e`)
</testing>

<code_quality>
- Linting: ESLint (`bun lint`)
- Formatting: Prettier (`bun format`)
- Unused exports: Knip (`bun knip`)
- Type checking: TypeScript (`bun typecheck`)
</code_quality>
