import { createSlice } from '@reduxjs/toolkit';

/** Redux state for layout-related UI settings */
interface LayoutState {
  /** Whether the sidebar (PropertiesPanel) is open */
  isSidebarOpen: boolean;
}

const initialState: LayoutState = {
  isSidebarOpen: false,
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    /** Toggle sidebar visibility */
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },

    /** Open the sidebar (when user selects an element) */
    openSidebar: (state) => {
      state.isSidebarOpen = true;
    },

    /** Close the sidebar */
    closeSidebar: (state) => {
      state.isSidebarOpen = false;
    },
  },
});

export const { toggleSidebar, openSidebar, closeSidebar } = layoutSlice.actions;
export default layoutSlice.reducer;
