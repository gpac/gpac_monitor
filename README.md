# GPAC Monitor

Real-time monitoring dashboard for GPAC.

## Quick Start

### Development Mode

```bash
# Install dependencies
pnpm install

# Terminal 1: Start GPAC with remote monitoring
# Example (use any GPAC command):
gpac -i input.mp4 vout -rmt

# Terminal 2: Start dashboard
pnpm dev
```

Dashboard available at `http://localhost:5173`

### Production Mode

```bash
# Build the application
pnpm build

# Open /release/index.html in your browser
# Then start GPAC with -rmt option

gpac -i input.mp4 vout -rmt
```

## Dashboard Overview

### Widgets

**Graph View** - Filter graph visualization

- Real-time filter topology with @xyflow/react
- Color-coded nodes by filter type
- Interactive zoom and pan

**Session Filters**

- Packets processed/sent
- Bytes transferred
- Filter performance metrics
- Stall detection (no progress warning)

**System Metrics** - Performance metrics

- Real-time CPU usage per filter
- Memory consumption tracking
- Time-series charts

**System Logs** - Application logs

- Log streaming from GPAC
- Filter by tool/level
- Search functionality

### View Panels

**Properties Panel**

- Filter details (status, type, index)
- Input/Output PIDs information
- Codec details and stream types
- Buffer states

**Filter Arguments**

- View filter configuration
- Inspect filter parameters
- See current values

**Connection Manager**

- Multiple GPAC connections
- Default connection: `ws://localhost:6363`
- Add/remove/switch connections

## Scripts

```bash
pnpm dev              # Development server (Vite)
pnpm build            # Production build (single HTML file)
pnpm preview          # Preview production build
pnpm test             # Run tests (Vitest)
pnpm lint             # ESLint check
pnpm format           # Format with Prettier
pnpm typecheck        # TypeScript type check

```

## Tech Stack

- **Frontend:** React 18 · TypeScript · Vite
- **State:** Redux Toolkit · Reselect
- **Visualization:** @xyflow/react · Recharts
- **Styling:** TailwindCSS · Radix UI
- **Communication:** WebSocket
- **Testing:** Vitest · Testing Library

## Architecture

```
src/
├── components/       # UI components (views, layout, widgets)
├── services/         # Business logic (WebSocket, handlers)
├── shared/           # Redux store, hooks, selectors
├── types/            # TypeScript types
├── utils/            # Pure utility functions
└── workers/          # Web Workers for heavy processing

server/               # GPAC-side monitoring server
├── server.js         # Entry point
├── JSClient/         # Client management
└── filterUtils.js    # Data transformation
```

## Key Features

- **Real-time Updates:** WebSocket connection to GPAC
- **Multiple Connections:** Monitor multiple GPAC instances
- **Filter Graph:** Interactive visualization with zoom/pan
- **Performance Tracking:** CPU, memory, bandwidth metrics
- **Log Streaming:** Real-time logs with filtering
- **Single File Build:** Production build generates one HTML file
