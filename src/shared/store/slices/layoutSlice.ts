import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/** Sidebar content types */
export type SidebarContentType =
  | { type: 'filter-args'; filterIdx: number; filterName: string }
  | { type: 'pid-props'; filterIdx: number; ipidIdx: number }
  | null;

/** Redux state for layout-related UI settings */
interface LayoutState {
  /** Sidebar content - null means closed */
  sidebarContent: SidebarContentType;
  /** Whether sidebar panel is visible */
  isSidebarOpen: boolean;
}

const initialState: LayoutState = {
  sidebarContent: null,
  isSidebarOpen: false,
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    /** Open sidebar with specific content */
    setSidebarContent: (state, action: PayloadAction<SidebarContentType>) => {
      state.sidebarContent = action.payload;
      if (action.payload !== null) {
        state.isSidebarOpen = true;
      }
    },

    /** Toggle sidebar visibility */
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },

    /** Close the sidebar */
    closeSidebar: (state) => {
      state.sidebarContent = null;
      state.isSidebarOpen = false;
    },
  },
});

export const { setSidebarContent, toggleSidebar, closeSidebar } =
  layoutSlice.actions;
export default layoutSlice.reducer;
