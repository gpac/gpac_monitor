import React from 'react';
import { Save, Layout, Settings, Download, Upload } from 'lucide-react';

interface HeaderProps {
  onSaveLayout?: () => void;
  onLoadLayout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSaveLayout, onLoadLayout }) => {
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
              onClick={onSaveLayout}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white text-sm"
            >
              <Save className="w-4 h-4" />
              Save Layout
            </button>
            <button
              onClick={onLoadLayout}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white text-sm"
            >
              <Download className="w-4 h-4" />
              Load Layout
            </button>
          </div>

          {/* Séparateur */}
          <div className="h-6 w-px bg-gray-700" />

          {/* Actions supplémentaires */}
          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
              title="Layout Settings"
            >
              <Layout className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
              title="Export Data"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
