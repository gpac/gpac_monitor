import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GpacMessage } from '@/types';
import { selectFilterNameById } from './graphSlice';
import { gpacService } from '@/services/gpacService';
import { RootState } from '../index';

interface ArgumentUpdate {
  filterId: string;
  name: string;
  value: any;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
}

interface FilterArgumentState {
  updates: Record<string, ArgumentUpdate>;
}

const initialState: FilterArgumentState = {
  updates: {},
};

// Slice
export const filterArgumentSlice = createSlice({
  name: 'filterArgument',
  initialState,
  reducers: {
    setArgumentUpdateStatus: (state, action: PayloadAction<ArgumentUpdate>) => {
      const key = `${action.payload.filterId}_${action.payload.name}`;
      state.updates[key] = action.payload;
    },
    clearArgumentUpdate: (
      state,
      action: PayloadAction<{
        filterId: string;
        name: string;
      }>,
    ) => {
      const key = `${action.payload.filterId}_${action.payload.name}`;
      delete state.updates[key];
    },
  },
});

// Actions
export const { setArgumentUpdateStatus, clearArgumentUpdate } =
  filterArgumentSlice.actions;

// Thunk

export const updateFilterArgument = createAsyncThunk(
  'filterArgument/updateFilterArgument',
  async (
    {
      filterId,
      argName,
      argValue,
    }: { filterId: string; argName: string; argValue: any },
    { dispatch, getState },
  ) => {
    try {
      // Get filter name from state using the selector
      const filterName = selectFilterNameById(
        getState() as RootState,
        filterId,
      );

      if (!filterName) {
        throw new Error(`Filter with ID ${filterId} not found`);
      }

      // Set pending status
      const pendingUpdate: ArgumentUpdate = {
        filterId,
        name: argName,
        value: argValue,
        status: 'pending',
      };
      dispatch(setArgumentUpdateStatus(pendingUpdate));

      // Send WebSocket message with correct filter name
      const message: GpacMessage = {
        type: 'update_arg',
        idx: parseInt(filterId),
        name: filterName, // Use the retrieved filter name
        argName: argName,
        newValue: argValue,
      };
      gpacService.sendMessage(message);

      // Set success status
      const successUpdate: ArgumentUpdate = {
        filterId,
        name: argName,
        value: argValue,
        status: 'success',
      };
      dispatch(setArgumentUpdateStatus(successUpdate));
    } catch (error) {
      console.error('Failed to update filter argument:', error);

      // Set error status
      const errorUpdate: ArgumentUpdate = {
        filterId,
        name: argName,
        value: argValue,
        status: 'error',
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      };
      dispatch(setArgumentUpdateStatus(errorUpdate));
      throw error;
    }
  },
);

// Selectors
export const selectArgumentUpdate = (
  state: { filterArgument: FilterArgumentState },
  filterId: string,
  name: string,
) => {
  const key = `${filterId}_${name}`;
  return state.filterArgument.updates[key];
};

export default filterArgumentSlice.reducer;
