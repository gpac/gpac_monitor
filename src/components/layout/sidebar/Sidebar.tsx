import PropertiesPanel from '../panels/PropertiesPanel';

const Sidebar = () => {
  return (
    <aside
      className="w-72 bg-monitor-app border-gray-800 h-full flex flex-col bg-opacity-90"
      role="complementary"
      aria-label="Dashboard widgets sidebar"
    >
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <PropertiesPanel />
      </div>
    </aside>
  );
};

export default Sidebar;
