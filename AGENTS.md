# Process

<decision_making>
- Demand precision. Insist on clarifying ambiguities and edge cases before beginning any implementation
- Seek consensus before moving forward with controversial or impactful changes
</decision_making>

<implementation>
- Insist on high standards. Accepting "good enough" normalizes mediocrity
- Follow established procedures. Consistency reduces errors and ensures accountability
- Consider edge cases carefully. Incomplete handling of edge cases leads to bugs and rework
- When no procedure exists, propose one before proceeding. Ad-hoc approaches create technical debt
- Request revisions if work does not meet expectations. It is easier to fix issues now than later
</implementation>

<definition_of_done>
- [ ] If you made significant changes, add appropriate tests (unit, integration, e2e, storybook) to cover them
- [ ] You ran `bun run format` to format the code and it passes with no errors
- [ ] You ran `bun run typecheck` to check for type errors and it passes with no errors
- [ ] You ran `bun run knip` to check for unused dependencies, exports and files and it passes with no errors
- [ ] You ran `bun run test:unit` to run unit tests and it passes with no errors
- [ ] You ran `bun run test:integration` to run integration tests and it passes with no errors
- [ ] You ran `bun run test:e2e` to run end-to-end tests and it passes with no errors
- [ ] You ran `bun run test:storybook` to run storybook tests and it passes with no errors
- [ ] You checked the `README.md` to make sure it is up to date
</definition_of_done>

# Coding Conventions

<file_naming>
- All file names must use kebab-case (e.g., `my-component.tsx`, `api-client.ts`)
</file_naming>

<code_style>
- Use TypeScript for all code
- Use early returns when possible
- Follow existing code patterns in the codebase
- Always use the `cn` utility from `@/lib/utilities` when merging or applying conditional classes
</code_style>

<react_best_practices>
- If you can calculate something during render, you don't need an Effect
- To cache expensive calculations, add useMemo instead of useEffect
- To reset the state of an entire component tree, pass a different key to it
- To reset a particular bit of state in response to a prop change, set it during rendering
- Code that runs because a component was displayed should be in Effects, the rest should be in events
- If you need to update the state of several components, it's better to do it during a single event
- Whenever you try to synchronize state variables in different components, consider lifting state up
- You can fetch data with Effects, but you need to implement cleanup to avoid race conditions
</react_best_practices>

# Project Structure

<directories>
- `src/` - React app (pages, components, hooks)
- `worker/` - Cloudflare Worker (API routes, Durable Objects)
- `shared/` - Shared code between frontend and worker
- `test/` - Unit, integration and end-to-end tests
- `.storybook/` - Storybook configuration
</directories>

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

<api_client>
- Use React Query hooks from `@/hooks/use-api` for all API calls
- Hono RPC client provides type-safe request/response types
- React Query handles caching, loading states, and cache invalidation
- Documentation: <https://tanstack.com/query/latest>, <https://hono.dev/docs/guides/rpc>
</api_client>

<build_and_tooling>
- Package manager: bun (use bun commands, not npm/yarn/pnpm)
- Build tool: Vite with @cloudflare/vite-plugin
- Dev server: bun dev (runs at localhost:3000)
- Install all dependencies as dev dependencies (`bun add -d`) since they are bundled with Vite
</build_and_tooling>

# Testing & Quality

<testing>
- Unit tests: Vitest (`bun run test:unit`)
- Integration tests: Vitest (`bun run test:integration`)
- Component tests: Storybook (`bun run test:storybook`)
- E2E tests: Playwright (`bun run test:e2e`)
</testing>

<code_quality>
- Linting: ESLint (`bun lint`)
- Formatting: Prettier (`bun format`)
- Report unused dependencies, exports and files: Knip (`bun knip`)
- Type checking: TypeScript (`bun typecheck`)
</code_quality>
