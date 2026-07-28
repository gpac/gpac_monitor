import { Provider } from 'react-redux';
import { store } from '../src/shared/store';
import DashboardLayout from './components/layout/header/DashboardLayout';
import { Toaster } from './components/ui/toaster';
import { DataSourceProvider } from './services/dataSource/DataSourceContext';

import './index.css';

const App = () => {
  return (
    <Provider store={store}>
      <DataSourceProvider>
        <div className=" bg-gray-950 text-white">
          <DashboardLayout />
          <Toaster />
        </div>
      </DataSourceProvider>
    </Provider>
  );
};

export default App;
