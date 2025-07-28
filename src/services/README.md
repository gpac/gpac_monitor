# Services Architecture

## Overview

The services layer provides the communication infrastructure for the GPAC Graph Monitor, handling WebSocket connections, data processing, and state management integration.

## Architecture

The services are organized into two main modules:

### 📡 GpacService (`/gpacService/`)

A complete WebSocket-based service for GPAC media framework communication with modular architecture:

#### Core Structure
- **`gpacService.ts`** - Main singleton service class
- **`config.ts`** - Configuration constants and WebSocket settings
- **`types.ts`** - TypeScript interfaces and type definitions
- **`index.ts`** - Public API exports

#### Infrastructure Layer (`/infrastructure/`)
- **`connectionManager.ts`** - WebSocket connection and reconnection logic with exponential backoff
- **`messageHandler.ts`** - Incoming message processing and routing to appropriate handlers
- **`subscriptionManager.ts`** - Filter and statistics subscription management

#### Core Logic (`/core/`)
- **`gpacCore.ts`** - Core GPAC protocol implementation and message handling
- **`types.ts`** - Core type definitions for GPAC communication

#### Integration Layer (`/integration/`)
- **`storeIntegration.ts`** - Redux store integration for automatic state updates

### 🔗 WebSocket Services (`/ws/`)

General-purpose WebSocket communication infrastructure:

- **`WebSocketBase.ts`** - Base WebSocket client with connection management
- **`notificationService.ts`** - Notification and event handling service
- **`formatters/`** - Message formatting utilities
  - **`messageFormatters.ts`** - WebSocket message formatting and validation

## Usage

### GpacService Integration

```typescript
import { gpacService } from '@/services/gpacService';

// Basic connection
await gpacService.connect();

// Message handling
gpacService.sendMessage({ type: 'get_all_filters' });

// Filter subscriptions
gpacService.subscribeToFilter('123');
gpacService.subscribeToSessionStats();

// Notification handlers
gpacService.setNotificationHandlers({
  onError: (error) => console.error('GPAC Error:', error),
  onFilterUpdate: (filter) => console.log('Filter updated:', filter),
  onConnectionStatus: (connected) => console.log('Connected:', connected)
});
```

### WebSocket Base Usage

```typescript
import { WebSocketBase } from '@/services/ws/WebSocketBase';

const ws = new WebSocketBase('ws://localhost:8080');
ws.connect();
ws.send({ type: 'ping' });
```

## Configuration

### GPAC Service Configuration
Located in `gpacService/config.ts`:

```typescript
export const WS_CONFIG = {
  address: 'ws://localhost:6363',
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  maxDelay: 10000,
};
```

## Message Types

The services handle these primary message categories:

### GPAC Protocol Messages
- **`filters`** - Complete filter graph data
- **`update`** - Filter graph updates  
- **`details`** - Detailed filter information
- **`session_stats`** - Session statistics
- **`cpu_stats`** - CPU usage statistics
- **`filter_stats`** - Individual filter metrics

### WebSocket Control Messages
- Connection status updates
- Subscription confirmations
- Error notifications
- Heartbeat messages

## Error Handling & Reliability

- **Automatic Reconnection** - Exponential backoff with configurable retry limits
- **Connection Status Tracking** - Real-time connection state notifications
- **Message Queue Management** - Buffering during disconnection periods
- **Error Callbacks** - Application-level error handling integration
- **State Synchronization** - Automatic Redux store updates

## Integration Points

### Redux Store Integration
- Automatic state updates through `storeIntegration.ts`
- Type-safe action dispatching
- Centralized state management for UI components

### React Component Integration
```typescript
// Through custom hooks
const { isConnected, filters } = useGpacService();

// Direct service access
import { gpacService } from '@/services/gpacService';
```

## Development Guidelines

### Adding New Message Types

1. **Update Types** - Add message interfaces in `types.ts`
2. **Handler Implementation** - Add processing logic in `MessageHandler`
3. **Redux Integration** - Update store slices if UI state is affected
4. **Service API** - Expose new functionality in main service class

### Testing Strategy

The modular architecture enables focused unit testing:

```typescript
// Test individual components
const connectionManager = new ConnectionManager(mockWs, 'ws://test');
const subscriptionManager = new SubscriptionManager(mockSendMessage);
const messageHandler = new MessageHandler(/* dependencies */);
```

### Code Organization

- **Separation of Concerns** - Clear boundaries between infrastructure, core logic, and integration
- **Dependency Injection** - Testable components with injected dependencies  
- **Type Safety** - Comprehensive TypeScript coverage
- **Error Boundaries** - Isolated error handling at each layer

## Monitoring & Debugging

### Debug Logging
Enable detailed service logging:
```javascript
localStorage.setItem('debug', 'services:*');
```

### Connection Monitoring
- Real-time connection status in Redux store
- WebSocket state tracking
- Reconnection attempt logging
- Performance metrics collection

This architecture provides a robust, maintainable foundation for real-time GPAC monitoring with clear separation of concerns and comprehensive error handling.