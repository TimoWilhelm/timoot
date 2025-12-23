# Timoot

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/TimoWilhelm/timoot)

Real-time quiz games that bring people together. Built on Cloudflare's edge.

## What is Timoot?

Timoot turns any gathering into an interactive quiz experience. Whether you're running a team all-hands, teaching a class, or just hanging out with friends — Timoot makes it easy to create and host live trivia.

**How it works:**

- **Host** throws the quiz up on a shared screen
- **Players** join from their phones via PIN or QR code
- **Everyone** competes in real-time with instant scoring

Every game runs on its own Durable Object, keeping state synced across all players via WebSockets. Zero lag, global scale.

## Features

- **AI-Powered Quiz Generation** — Describe your topic, get a quiz instantly via Cloudflare AI Gateway
- **Real-time Multiplayer** — WebSocket-powered gameplay with sub-second updates
- **Two-Screen Experience** — Big screen for the host, phones for players
- **Instant Join** — PIN code or QR scan, no app download needed
- **Speed Scoring** — Faster correct answers = more points
- **Quiz Editor** — Build and customize your own quizzes
- **Edge-Native** — Runs entirely on Cloudflare Workers and Durable Objects

## Tech Stack

| Layer          | Tools                                  |
| -------------- | -------------------------------------- |
| **Frontend**   | React, TypeScript, Tailwind CSS        |
| **State**      | Zustand                                |
| **Animations** | Framer Motion                          |
| **Backend**    | Cloudflare Workers, Hono               |
| **Realtime**   | Cloudflare Durable Objects, WebSockets |
| **AI**         | Cloudflare AI Gateway, AI SDK          |
| **Tooling**    | Vite, Bun                              |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) — fast JS runtime and package manager
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)

### Setup

```bash
# Clone the repo
git clone https://github.com/TimoWilhelm/timoot.git
cd timoot

# Install dependencies
bun install

# Log into Cloudflare
bunx wrangler login
```

### Development

```bash
bun dev
```

This fires up everything at `http://localhost:3000`:

- React frontend with hot reload
- Cloudflare Worker running locally via the Vite plugin
- Full Durable Objects support for real-time features

The `@cloudflare/vite-plugin` handles all the wiring between your frontend and worker automatically.

### Environment Setup

The app works out of the box for basic quiz hosting. For AI-powered quiz generation, you'll need to configure a few things.

**1. Copy the example env file:**

```bash
cp .env.example .env
```

**2. Fill in your Cloudflare credentials:**

| Variable                          | Where to find it                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`           | [Dashboard](https://dash.cloudflare.com/) → right sidebar                                                                             |
| `CLOUDFLARE_AI_GATEWAY_ID`        | [AI Gateway](https://dash.cloudflare.com/?to=/:account/ai/ai-gateway) → create or select a gateway                                    |
| `CLOUDFLARE_AI_GATEWAY_API_TOKEN` | [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → create token with AI Gateway permissions                               |
| `CLOUDFLARE_AI_GATEWAY_MODEL`     | [Dynamic routing](https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/) → create a dynamic route in your AI Gateway |

**3. For production**, add these as secrets via Wrangler:

```bash
bunx wrangler secret put CLOUDFLARE_ACCOUNT_ID
bunx wrangler secret put CLOUDFLARE_AI_GATEWAY_ID
bunx wrangler secret put CLOUDFLARE_AI_GATEWAY_API_TOKEN
bunx wrangler secret put CLOUDFLARE_AI_GATEWAY_MODEL
```

## Project Structure

```text
src/           → React app (pages, components, hooks)
worker/        → Cloudflare Worker (API routes, Durable Objects)
shared/        → Shared TypeScript types
wrangler.jsonc → Worker configuration
```

## Deploy

Ship it to Cloudflare's edge in one command:

```bash
bun run deploy
```

## License

MIT
