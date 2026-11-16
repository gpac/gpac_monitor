import ReactDOM from 'react-dom/client';
import { ReactFlowProvider } from '@xyflow/react';
import App from './App';
import AppErrorBoundary from './components/layout/AppErrorBoundary';
import 'overlayscrollbars/overlayscrollbars.css';
import './index.css';
import './styles/performance.css';
import { StrictMode } from 'react';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
