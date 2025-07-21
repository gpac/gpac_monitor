# GpacService Documentation

## Overview

GpacService is a WebSocket-based service that manages communication with GPAC media framework servers. It provides real-time graph monitoring, filter management, and subscription handling through a modular architecture.

## Architecture

The service is split into specialized modules for better maintainability:

- **`GpacService`** - Main singleton service class
- **`ConnectionManager`** - WebSocket connection and reconnection logic
- **`SubscriptionManager`** - Filter and statistics subscription handling  
- **`MessageHandler`** - Incoming message processing and routing
- **`config.ts`** - Configuration constants
- **`types.ts`** - TypeScript interfaces and types

## Usage

### Basic Connection

```typescript
import { gpacService } from '@/services/gpacService';

// Connect to GPAC server
await gpacService.connect();

// Check connection status
const isConnected = gpacService.isConnected();

// Disconnect
gpacService.disconnect();
```

### Message Handling

```typescript
// Send messages to GPAC server
gpacService.sendMessage({ 
  type: 'get_all_filters' 
});

// Set up notification handlers
gpacService.setNotificationHandlers({
  onError: (error) => console.error('GPAC Error:', error),
  onFilterUpdate: (filter) => console.log('Filter updated:', filter),
  onConnectionStatus: (connected) => console.log('Connected:', connected)
});
```

### Filter Subscriptions

```typescript
// Subscribe to filter updates
gpacService.subscribeToFilter('123');

// Get filter details
gpacService.getFilterDetails(123);

// Subscribe to system statistics
gpacService.subscribeToSessionStats();
gpacService.subscribeToCpuStats();

// Unsubscribe
gpacService.unsubscribeFromFilter('123');
```

## Configuration

Default configuration in `config.ts`:

```typescript
export const NEW_WS_CONFIG = {
  address: 'ws://localhost:6363',
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  maxDelay: 10000,
};
```

## Message Types

The service handles these GPAC message types:

- **`filters`** - Complete filter graph data
- **`update`** - Filter graph updates  
- **`details`** - Detailed filter information
- **`session_stats`** - Session statistics
- **`cpu_stats`** - CPU usage statistics
- **`filter_stats`** - Individual filter metrics

## Error Handling

- Automatic reconnection with exponential backoff
- Connection status notifications
- Error callbacks for application-level handling
- Redux store integration for UI state updates

## Integration

The service integrates with:

- **Redux Store** - Automatic state updates
- **React Components** - Through hooks like `useGpacService`
- **Communication Adapters** - For protocol abstraction

## Development

### Adding New Message Types

1. Add message type to `MessageHandler.processGpacMessage()`
2. Implement handler method in `MessageHandler`
3. Update Redux slices if needed
4. Add TypeScript types in `types.ts`

### Testing

The modular architecture allows easy unit testing of individual components:

```typescript
// Test connection logic
const connectionManager = new ConnectionManager(mockWs, 'ws://test');

// Test subscription handling  
const subscriptionManager = new SubscriptionManager(mockSendMessage);

// Test message processing
const messageHandler = new MessageHandler(/* ... */);
```