import React, { useState, useRef, useEffect } from 'react';
import { FiLayout } from 'react-icons/fi';
import { LayoutManager } from './LayoutManager';
import WidgetSelector from './Widget/WidgetSelector';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
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
    <header className="h-14 bg-gray-900 border-b border-gray-700 px-4">
      <div className="h-full flex items-center justify-between">
        {/* Left: Logo + Widget Selector */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-gray-200 font-ui">GPAC Monitor</h1>
          <div className="h-6 w-px bg-gray-700" />
          <WidgetSelector
            isOpen={showWidgetSelector}
            onToggle={() => setShowWidgetSelector(!showWidgetSelector)}
            onClose={() => setShowWidgetSelector(false)}
          />
        </div>

        {/* Right: Layout Manager */}
        <div className="flex items-center gap-4">
          <div className="h-6 w-px bg-gray-700" />
          <button
            onClick={() => setShowLayoutManager(!showLayoutManager)}
            className="flex items-center gap-2 px-3 py-2 text-gray-300 font-ui hover:text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FiLayout className="w-4 h-4" />
            Layouts
          </button>
        </div>
      </div>

      {/* Layout Manager Dropdown */}
      {showLayoutManager && (
        <div
          ref={dropdownRef}
          className="absolute top-14 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-80"
        >
          <LayoutManager />
        </div>
      )}
    </header>
  );
};

export default Header;
