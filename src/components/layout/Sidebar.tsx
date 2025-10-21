import React from 'react';
import LogCounters from './LogCounters';
import PropertiesPanel from './panels/PropertiesPanel';

const Sidebar: React.FC = () => {
  return (
    <aside
      className="w-64 bg-gray-900 border-r border-gray-800 h-full flex flex-col"
      role="complementary"
      aria-label="Dashboard widgets sidebar"
    >
      <div className="p-4">
        <div className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">
          Logs Monitor
        </div>
        <LogCounters />
      </div>

      {/* Separator */}
      <div className="w-full h-px bg-gray-700 my-2" />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <PropertiesPanel />
      </div>
    </aside>
  );
};

export default Sidebar;
