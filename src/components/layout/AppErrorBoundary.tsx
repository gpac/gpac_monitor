import React from 'react';
import { LuRefreshCw, LuTriangleAlert } from 'react-icons/lu';
import { Button } from '@/components/ui/button';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    console.error('[AppErrorBoundary] app crashed:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-2 h-screen bg-monitor-app p-4 text-center"
      >
        <LuTriangleAlert className="w-6 h-6 text-amber-400" />
        <p className="text-sm font-medium text-monitor-text-primary">
          GPAC Monitor stopped working
        </p>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="mt-1"
          onClick={() => window.location.reload()}
        >
          <LuRefreshCw className="w-3 h-3 mr-1.5" /> Reload
        </Button>
      </div>
    );
  }
}

export default AppErrorBoundary;
