# GPAC Monitor

Real-time monitoring dashboard for GPAC.

Watch a running GPAC session from your browser: filter graph, per-filter stats, CPU and memory,
logs and live video preview of PIDs. Record sessions and replay them later, with or without GPAC.

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

To work on the server, run `pnpm build` and start GPAC with `-rmt -rmt-path=release/server.js`.

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

- Real-time CPU usage of the GPAC process
- Memory consumption tracking
- Time-series charts

**System Logs** - Application logs

- Log streaming from GPAC
- Filter by tool/level

**Previews** - Live video preview of PIDs

- Decoded in the browser with WebCodecs (H.264, HEVC, AV1, depending on browser support)
- Open from the Preview button of a video PID, or from the Previews widget
- Keyframes only when the source runs faster than 1.5x real time
- Live sessions only; requires a GPAC version that supports preview

### Session Replay

- Record a session: `gpac ... -rmt -rmt-log=<folder>`
- Replay it from the session list of a connected GPAC, or drop the folder in the browser (no GPAC needed)
- Seek on the timeline: graph, stats and logs show the state at that time

### View Panels

**Properties Panel**

- Filter details (status, type, index)
- Input/Output PIDs information
- Codec details and stream types
- Buffer states

**Filter Arguments**

- View filter arguments and their current values
- Edit updatable arguments live

**Connection Manager**

- Saved GPAC connections, one active at a time
- Default connection: `ws://localhost:6363`
- Add/remove/switch connections

## Scripts

```bash
pnpm dev              # Development server (Vite)
pnpm build            # Production build (single HTML file + bundled server)
pnpm preview          # Preview production build
pnpm test             # Run tests (Vitest)
pnpm lint             # ESLint check
pnpm format           # Format with Prettier
pnpm typecheck        # TypeScript type check
```

## Tech Stack

- **Frontend:** React 18 · TypeScript · Vite
- **State:** Redux Toolkit · Reselect
- **Visualization:** @xyflow/react · uPlot · WebCodecs
- **Styling:** TailwindCSS · Radix UI
- **Communication:** WebSocket
- **Testing:** Vitest · Testing Library

## Architecture

```
src/
├── components/       # UI components (views, layout, widgets)
├── services/         # Business logic (WebSocket, handlers, history replay)
├── shared/           # Redux store, hooks, selectors
├── types/            # TypeScript types
├── utils/            # Pure utility functions
└── workers/          # Web Workers for heavy processing

server/               # GPAC-side monitoring server
├── server.js         # Entry point
├── JSClient/         # Client management, filterUtils.js, Preview/
└── history/          # Session recording
```

## Key Features

- **Real-time Updates:** WebSocket connection to GPAC
- **Saved Connections:** Switch between GPAC instances
- **Filter Graph:** Interactive visualization with zoom/pan
- **Performance Tracking:** CPU, memory, bandwidth metrics
- **Log Streaming:** Real-time logs with filtering
- **Video Preview:** Live WebCodecs preview of video PIDs
- **Session Replay:** Record a session and replay it on a timeline
- **Single File Build:** Production build generates one HTML file
