# GPAC Monitor

Real-time monitoring dashboard for GPAC multimedia framework.

## Quick Start

```bash
# Install dependencies
pnpm install

# Terminal 1: Start GPAC with monitoring
gpac -js=server.js -i your-file.mp4 vout

# Terminal 2: Start dashboard
pnpm dev
```

Dashboard available at `http://localhost:5173`

## Scripts

```bash
pnpm dev        # Development server
pnpm build      # Production build
pnpm preview    # Preview
pnpm test       # Tests
pnpm lint       # Linting
pnpm typecheck  # Type checking
```

## Tech

React 18 · TypeScript · Vite · Redux · WebSocket · @xyflow/react · TailwindCSS
