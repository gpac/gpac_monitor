
# GPAC Monitoring Dashboard

A comprehensive real-time multimedia monitoring dashboard for GPAC (GPAC Project on Advanced Content) multimedia framework, providing detailed pipeline visualization and performance analytics.

## ✨ Features

### Core Monitoring Capabilities
- 📊 **Interactive Pipeline Visualization** - Real-time graph representation of GPAC processing chains
- 📈 **Advanced Filter Metrics** - Comprehensive monitoring of filter performance and statistics
- 🔄 **Live WebSocket Updates** - Real-time data streaming with minimal latency
- 📱 **Responsive Interface** - Modern, adaptive UI that works across devices

### Monitoring Components
- **GraphMonitor** - Interactive pipeline visualization with node relationships
- **FilterMonitor** - Individual filter performance tracking with detailed metrics
- **SessionStats** - Session-wide statistics and analytics overview
- **BufferAnalytics** - Buffer state monitoring and performance analysis
- **CPU & Resource Monitoring** - System resource utilization tracking
- **Audio Stream Analysis** - Real-time audio processing metrics
- **Logs Monitor** - Centralized logging and debugging interface

## 🚀 Installation

### Prerequisites
- **GPAC Framework** - Latest version installed and configured
- **Node.js** - Version 16+ and npm
- **Modern Browser** - Chrome, Firefox, Safari, or Edge with WebSocket support
- **Multimedia Files** - Sample content for testing and monitoring

### Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd Graph_Monitor

# Install dependencies
npm install

# Start development server
npm run dev
```

### Running the Monitoring System

#### 1. Start the GPAC Server
```bash
# Navigate to server directory
cd Graph_Monitor/server

# Launch GPAC with monitoring enabled
# Basic example for MP4 monitoring:
gpac -js=mx.js -i your-file.mp4 vout -graph -rmt

# Advanced example with custom parameters:
gpac -js=mx.js -i input.mp4 -o output.mp4 -graph -rmt --filter-args
```

#### 2. Launch the Dashboard
```bash
# Navigate to project root
cd Graph_Monitor

# Start the monitoring dashboard
npm run dev
```

The dashboard will be available at `http://localhost:5173` (or your configured port).

### 🔧 Configuration

The system supports various configuration options:
- **WebSocket Port**: Default 17815 (configurable)
- **Update Frequency**: Adjustable refresh rates
- **Filter Selection**: Choose specific filters to monitor
- **Display Options**: Customizable dashboard layouts

## 🏗️ Architecture

### Enhanced Project Structure
```
src/
├── components/
│   ├── views/
│   │   ├── graph/           # Pipeline visualization
│   │   │   ├── hooks/       # Graph-specific React hooks
│   │   │   ├── ui/          # Graph UI components
│   │   │   └── utils/       # Graph utilities & operations
│   │   ├── stats-session/   # Session statistics & analytics
│   │   ├── monitoring/      # Real-time monitoring components
│   │   ├── cpu/            # CPU & resource monitoring
│   │   ├── audio/          # Audio stream analysis
│   │   └── logs/           # Logging interface
│   ├── widgets/            # Reusable monitoring widgets
│   ├── common/             # Shared UI components
│   └── layout/             # Application layout
├── services/
│   ├── gpacService/        # GPAC integration services
│   └── ws/                 # WebSocket communication
├── store/
│   └── slices/             # Redux state management
├── types/
│   └── domain/             # Domain-specific TypeScript definitions
│       ├── gpac/           # GPAC-related types
│       ├── filters/        # Filter argument types
│       └── monitoring/     # Monitoring data types
├── utils/
│   └── bufferAnalytics.ts  # Buffer analysis utilities
└── shared/                 # Shared utilities and helpers
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Redux Toolkit with RTK Query
- **Real-time Communication**: WebSocket with automatic reconnection
- **Visualization**: Custom D3.js-based graph rendering
- **Styling**: Modern CSS with component-based architecture
- **Build System**: Vite with HMR for development

### Key Improvements & Recent Updates
- **Refactored Architecture**: Reorganized components for better maintainability
- **Enhanced Type Safety**: Comprehensive TypeScript definitions across the codebase
- **Improved Performance**: Optimized rendering and state management
- **Better UX**: Enhanced session statistics interface and filter monitoring
- **Code Organization**: Cleaner imports and improved project structure

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server with HMR
npm run build        # Production build
npm run preview      # Preview production build
npm run type-check   # TypeScript type checking
npm run lint         # Code linting
```

### Monitoring Features in Detail

#### Graph Monitor
- **Interactive Nodes**: Click and drag pipeline components
- **Real-time Updates**: Live pipeline state changes
- **Performance Metrics**: Node-level processing statistics
- **Connection Tracking**: Data flow visualization between filters

#### Session Statistics
- **Filter Overview**: Comprehensive filter performance grid
- **Resource Utilization**: CPU, memory, and buffer usage
- **Throughput Analysis**: Packet processing rates and timing
- **Error Tracking**: Real-time error detection and reporting

#### Buffer Analytics
- **Buffer State Monitoring**: Real-time buffer level tracking
- **Performance Analysis**: Buffer efficiency and optimization insights
- **Resource Management**: Memory usage patterns and optimization

## 🔍 Troubleshooting

### Common Issues
- **WebSocket Connection Failures**: 
  - Ensure GPAC server is running with `-rmt` flag
  - Verify port 17815 is available
  - Restart the mx.js script if connection drops

- **Performance Issues**:
  - Reduce update frequency for large pipelines
  - Check browser console for detailed error messages
  - Monitor system resources during heavy processing

- **Filter Detection Problems**:
  - Verify GPAC is running with graph monitoring enabled
  - Check filter configurations and parameters
  - Ensure multimedia files are accessible

### Debug Mode
Enable detailed logging by setting debug flags in the console:
```javascript
localStorage.setItem('debug', 'gpac:*');
```

## 📊 Monitoring Capabilities

The dashboard provides comprehensive monitoring across multiple dimensions:

- **Pipeline Health**: Real-time status of all filters and connections
- **Performance Metrics**: Throughput, latency, and resource utilization
- **Error Tracking**: Automatic detection and reporting of processing issues
- **Resource Management**: Memory, CPU, and buffer usage monitoring
- **Session Analytics**: Historical data and performance trends

## 🤝 Contributing

This monitoring dashboard is designed to provide deep insights into GPAC multimedia processing pipelines, making it easier to optimize performance, debug issues, and understand complex media workflows.

For questions, issues, or contributions, please refer to the project documentation and issue tracker.

