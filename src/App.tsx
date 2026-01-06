import { Provider } from 'react-redux';
import { store } from '../src/shared/store';
import DashboardLayout from './components/layout/header/DashboardLayout';
import { Toaster } from './components/ui/toaster';

import './index.css';

const App = () => {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-950 text-white">
        <DashboardLayout />
        <Toaster />
      </div>
    </Provider>
  );
};

export default App;
