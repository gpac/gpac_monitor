import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import PropertiesPanel from '../panels/PropertiesPanel';

const Sidebar = () => {
  return (
    <aside
      className="w-72 bg-monitor-app border-gray-800 h-full flex flex-col bg-opacity-90"
      role="complementary"
      aria-label="Dashboard widgets sidebar"
    >
      <OverlayScrollbarsComponent
        element="div"
        options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 400 } }}
        className="flex-1 px-4 pb-4"
      >
        <PropertiesPanel />
      </OverlayScrollbarsComponent>
    </aside>
  );
};

export default Sidebar;
