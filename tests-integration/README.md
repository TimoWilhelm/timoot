# Integration & Load Tests

This directory contains end-to-end integration tests and load tests for the Timoot quiz game application.

## Overview

- **Integration Tests**: Validate real user flows including game creation, player joining, answering questions, emoji reactions, and game completion.
- **Load Tests**: Stress test the application with multiple concurrent players and games.

## Prerequisites

The tests require a running instance of the application (local or remote).

### Local Testing

1. Start the development server:

   ```bash
   bun run dev
   ```

2. In another terminal, run integration tests:
   ```bash
   bun run test:integration
   ```

### Remote Testing

To test against a deployed instance:

```bash
TEST_BASE_URL=https://your-app.pages.dev bun run test:integration
```

## Available Commands

| Command                          | Description                                           |
| -------------------------------- | ----------------------------------------------------- |
| `bun run test:integration`       | Run integration tests against localhost:3000          |
| `bun run test:integration:watch` | Run integration tests in watch mode                   |
| `bun run test:load`              | Run load tests against localhost:3000                 |
| `bun run test:load:remote`       | Run load tests against remote URL (set TEST_BASE_URL) |

## Environment Variables

| Variable                     | Default                 | Description                                   |
| ---------------------------- | ----------------------- | --------------------------------------------- |
| `TEST_BASE_URL`              | `http://localhost:3000` | Target server URL                             |
| `RUN_LOAD_TESTS`             | `false`                 | Set to `true` to enable load tests            |
| `LOAD_TEST_PLAYERS`          | `20`                    | Number of virtual players per game            |
| `LOAD_TEST_CONCURRENT_GAMES` | `3`                     | Number of concurrent games in multi-game test |
| `LOAD_TEST_EMOJI_BURST`      | `5`                     | Emojis sent per player during burst test      |

## Test Structure

```
tests-integration/
├── utils/
│   └── ws-client.ts       # WebSocket test client utilities
├── gameFlow.integration.test.ts    # User flow integration tests
├── loadTest.integration.test.ts    # Load and stress tests
└── README.md              # This file
```

## Integration Test Coverage

### Game Creation and Lobby

- ✅ Create a new game via API
- ✅ Host connects to game
- ✅ Player connects and joins game
- ✅ Reject duplicate nicknames
- ✅ Multiple players joining

### Full Game Flow

- ✅ Complete game with host and players
- ✅ Emoji sending during reveal phase

### Player Reconnection

- ✅ Player reconnects with token

### Error Handling

- ✅ Reject invalid host secret
- ✅ Reject joining after game started
- ✅ Reject answers outside question phase

## Load Test Scenarios

### Single Game Load Test

Tests handling of many concurrent players (default: 20) in a single game room.

**Metrics tracked:**

- Connection success rate
- Join success rate
- Answer submission rate
- Average latency for each operation
- Total test duration

### Multiple Concurrent Games

Tests handling multiple games (default: 3) running simultaneously, each with multiple players.

### Emoji Burst Test

Tests rapid emoji sending from multiple players to verify the system handles high-frequency messages.

### Rapid Player Joins

Stress tests the lobby by having many players join simultaneously to check for race conditions.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install

      - name: Start dev server
        run: bun run dev &

      - name: Wait for server
        run: |
          timeout 30 bash -c 'until curl -s http://localhost:3000/api/health; do sleep 1; done'

      - name: Run integration tests
        run: bun run test:integration

  load-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - run: bun install

      - name: Start dev server
        run: bun run dev &

      - name: Wait for server
        run: |
          timeout 30 bash -c 'until curl -s http://localhost:3000/api/health; do sleep 1; done'

      - name: Run load tests
        run: bun run test:load
        env:
          LOAD_TEST_PLAYERS: 10
          LOAD_TEST_CONCURRENT_GAMES: 2
```

### Running Against Production

```bash
# Run integration tests against production
TEST_BASE_URL=https://timoot.pages.dev bun run test:integration

# Run load tests against staging (with reduced load)
TEST_BASE_URL=https://staging.timoot.pages.dev \
  LOAD_TEST_PLAYERS=10 \
  LOAD_TEST_CONCURRENT_GAMES=2 \
  bun run test:load
```

## Programmatic Usage

The load test can be run programmatically:

```typescript
import { runLoadTest } from './loadTest.integration.test';

const result = await runLoadTest({
  baseUrl: 'http://localhost:3000',
  playerCount: 50,
  gameCount: 5,
  sendEmojis: true,
});

console.log('Success:', result.success);
console.log('Metrics:', result.metrics);
```

## Troubleshooting

### Connection Timeouts

- Ensure the server is running and accessible
- Check firewall settings
- Increase timeout values if testing against slow networks

### High Failure Rates in Load Tests

- Reduce `LOAD_TEST_PLAYERS` for constrained environments
- Check server resource limits (WebSocket connections, memory)
- Review server logs for errors

### WebSocket Errors

- Verify WebSocket upgrade is supported by any proxies
- Check that the server supports the required number of connections
