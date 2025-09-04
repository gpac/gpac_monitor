import React, { useState, useRef, useEffect } from 'react';
import { Layout, Settings } from 'lucide-react';
import { LayoutManager } from './LayoutManager';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [showLayoutManager, setShowLayoutManager] = useState(false);
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
    <header className="h-16 bg-gray-900 border-b border-gray-700 px-4">
      <div className="h-full max-w-screen-2xl mx-auto flex items-center justify-between">
        {/* Logo et titre */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white">GPAC Monitor</h1>
          <span className="text-sm text-gray-400"> </span>
          <div className="h-6 w-px bg-gray-700" /> {/* Séparateur vertical */}
        </div>

        {/* Actions principales */}
        <div className="flex items-center space-x-4">
          {/* Séparateur */}
          <div className="h-6 w-px bg-gray-700" />

          {/* Boutons de layout */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowLayoutManager(!showLayoutManager)}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white text-sm"
            >
              <Layout className="w-4 h-4" />
              Layouts
            </button>
          </div>

          {/* Séparateur */}
          <div className="h-6 w-px bg-gray-700" />

          {/* Actions supplémentaires */}
          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Layout Manager Dropdown */}
      {showLayoutManager && (
        <div
          ref={dropdownRef}
          className="absolute top-16 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-80"
        >
          <LayoutManager />
        </div>
      )}
    </header>
  );
};

export default Header;
