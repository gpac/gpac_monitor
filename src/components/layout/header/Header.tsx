import { useState, useRef, useEffect, useCallback } from 'react';
import { FiLayout } from 'react-icons/fi';
import {
  LuClapperboard,
  LuPanelLeft,
  LuPanelLeftClose,
  LuRotateCw,
} from 'react-icons/lu';
import { LayoutManager } from '../header/LayoutManager';
import WidgetSelector from '../../widget/WidgetSelector';
import ConnectionSelector from '../connection/ConnectionSelector';
import LogCounters from './LogCounters';
import HistoryControls from '@/components/history/HistoryControls';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { toggleSidebar } from '@/shared/store/slices/layoutSlice';

const Header = () => {
  const dispatch = useAppDispatch();
  const isSidebarOpen = useAppSelector((state) => state.layout.isSidebarOpen);
  const { mode } = useDataSource();
  const openHistoryTab = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'history');
    window.open(url.toString(), '_blank');
  }, []);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLayoutManager(false);
      }
    };

    if (showLayoutManager) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLayoutManager]);

  return (
    <header className="h-14 bg-monitor-app border-b border-white/10 px-4 text-white/80">
      <div className="h-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-gray-200 font-ui">
            GPAC Monitor
          </h1>
          <div className="h-6 w-px bg-gray-700" />
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            title="Reload page"
            aria-label="Reload page"
          >
            <LuRotateCw className="w-4 h-4" />
          </button>
          {mode === 'live' && (
            <button
              onClick={openHistoryTab}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-gray-800"
              title="Open history in new tab"
            >
              <LuClapperboard className="w-4 h-4" />
              History
            </button>
          )}
          {mode !== 'history' && (
            <span aria-label="Connection selector" title="Connection selector">
              <ConnectionSelector />
            </span>
          )}
          <span aria-label="Widget selector" title="Widget selector">
            <WidgetSelector
              isOpen={showWidgetSelector}
              onToggle={() => setShowWidgetSelector(!showWidgetSelector)}
              onClose={() => setShowWidgetSelector(false)}
              aria-label="Widget selector"
            />
          </span>
          <span aria-label="Log counters" title="Log counters">
            <LogCounters />
          </span>
          <HistoryControls />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="flex items-center gap-2 px-3 py-2 text-gray-300 font-ui hover:text-white text-sm rounded-lg hover:bg-gray-800"
            title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen ? (
              <LuPanelLeftClose className="w-4 h-4" />
            ) : (
              <LuPanelLeft className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isSidebarOpen ? 'Hide' : 'Show'} Sidebar
            </span>
          </button>

          <div className="h-6 w-px bg-gray-700" />

          <button
            onClick={() => setShowLayoutManager(!showLayoutManager)}
            className="flex items-center gap-2 px-3 py-2 text-gray-300 font-ui hover:text-white text-sm rounded-lg hover:bg-gray-800"
          >
            <FiLayout className="w-4 h-4" />
            Layouts
          </button>
        </div>
      </div>

      {showLayoutManager && (
        <div
          ref={dropdownRef}
          className="absolute top-14 right-4 border border-gray-700 rounded-lg shadow-lg z-50 min-w-80"
        >
          <LayoutManager />
        </div>
      )}
    </header>
  );
};

export default Header;
