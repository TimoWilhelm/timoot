
# Agents.md

This document is a collection of guidelines for agents working on the project.

## Definition of Done

- [ ] If you made significant changes, add appropriate tests (unit, integration, e2e, storybook) to cover them.

- [ ] You ran `bun run format` to format the code and it passes with no errors.

- [ ] You ran `bun run typecheck` to check for type errors and it passes with no errors.

- [ ] You ran `bun run knip` to check for unused dependencies, exports and files and it passes with no errors.

- [ ] You ran `bun run test:unit` to run unit tests and it passes with no errors.

- [ ] You ran `bun run test:integration` to run integration tests and it passes with no errors.

- [ ] You ran `bun run test:e2e` to run end-to-end tests and it passes with no errors.

- [ ] You ran `bun run test:storybook` to run storybook tests and it passes with no errors.

- [ ] You checked the `README.md` to make sure it is up to date.

## Coding Conventions

- All file names must use kebab-case (e.g., `my-component.tsx`, `api-client.ts`).

- Use TypeScript for all code.

- Use early returns when possible.

- Follow existing code patterns in the codebase.

- Always use the `cn` utility from `@/lib/utilities` when merging or applying conditional classes.

## React Best Practices

- If you can calculate something during render, you don't need an Effect.

- To cache expensive calculations, add useMemo instead of useEffect.

- To reset the state of an entire component tree, pass a different key to it.

- To reset a particular bit of state in response to a prop change, set it during rendering.

- Code that runs because a component was displayed should be in Effects, the rest should be in events.

- If you need to update the state of several components, it's better to do it during a single event.

- Whenever you try to synchronize state variables in different components, consider lifting state up.

- You can fetch data with Effects, but you need to implement cleanup to avoid race conditions.

## Project Structure

- **Group by Feature**: Organize files by feature, not type. Code that changes together stays together.

- **Reusable Components**: Place strictly reusable UI components in `src/components/[type]` (e.g., `buttons`, `forms`).

- **Feature Modules**: Each part of the website (feature) has its own folder in `src/features/` containing its specific pages, components, and hooks.

- Colocate unit tests with the code they test.

- Integration and E2E tests remain in `test/` directory.

## Directories

- `src/` - React app sources.

- `components/` - Reusable UI components grouped by type (e.g. `button/`, `dialog/`).

- `features/` - Feature-based modules (e.g. `game/`, `auth/`) containing pages, components, hooks, and utils.

- `lib/` - Shared utilities and libraries.

- `hooks/` - Shared global hooks.

- `worker/` - Cloudflare Worker (API routes, Durable Objects).

- `shared/` - Shared code between frontend and worker.

- `test/` - Integration and E2E tests.

- `.storybook/` - Storybook configuration.

## Tech Stack

### Frontend

- React with TypeScript.

- TanStack React Query for server state management.

- Tailwind CSS for styling.

- Zustand for client state management.

- Framer Motion for animations.

### Backend

- Cloudflare Workers with Hono framework.

- Cloudflare Durable Objects for real-time features.

- WebSockets for real-time communication.

- Durable Objects SQLite and KV for storage.

### API Client

- Use React Query hooks from `@/hooks/use-api` for all API calls.

- Hono RPC client provides type-safe request/response types.

- React Query handles caching, loading states, and cache invalidation.

- Documentation: <https://tanstack.com/query/latest>, <https://hono.dev/docs/guides/rpc>.

### Build and Tooling

- Package manager: bun (use bun commands, not npm/yarn/pnpm).

- Build tool: Vite with @cloudflare/vite-plugin.

- Dev server: bun dev (runs at localhost:3000).

- Install all dependencies as dev dependencies (`bun add -d`) since they are bundled with Vite.

## Testing & Quality

- Unit tests: Vitest (`bun run test:unit`).

- Integration tests: Vitest (`bun run test:integration`).

- Component tests: Vitest + Storybook (`bun run test:storybook`).

- E2E tests: Vitest + Playwright (`bun run test:e2e`).

- Linting: ESLint (`bun lint`).

- Formatting: Prettier (`bun format`).

- Report unused dependencies: Knip (`bun knip`).

- Type checking: TypeScript (`bun typecheck`).
