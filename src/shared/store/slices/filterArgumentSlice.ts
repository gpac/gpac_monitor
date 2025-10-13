import {
  createSlice,
  PayloadAction,
  createAsyncThunk,
  createSelector,
} from '@reduxjs/toolkit';
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
      const filterName = selectFilterNameById(getState() as any, filterId);

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

      // Send update and wait for server response
      const result = await gpacService.updateFilterArg(
        parseInt(filterId),
        filterName,
        argName,
        argValue,
      );

      // Check result from server
      if (result.success) {
        // Set success status with actual value from server
        const successUpdate: ArgumentUpdate = {
          filterId,
          name: argName,
          value: result.actualValue,
          status: 'success',
        };
        dispatch(setArgumentUpdateStatus(successUpdate));

        return result;
      } else {
        // Server returned failure
        throw new Error(result.error || 'Update failed on server');
      }
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

/** Memoized selector for filter argument updates by filter */
export const makeSelectArgumentUpdatesForFilter = () =>
  createSelector(
    [
      (state: RootState) => state.filterArgument.updates,
      (_: RootState, filterId: string) => filterId,
      (_: RootState, __: string, gpacArgs: any[]) => gpacArgs,
    ],
    (updates, filterId, gpacArgs) => {
      if (!Array.isArray(gpacArgs)) return {};

      return gpacArgs.reduce(
        (acc, arg) => {
          const key = `${filterId}_${arg.name}`;
          acc[arg.name] = updates[key];
          return acc;
        },
        {} as Record<string, any>,
      );
    },
  );

export default filterArgumentSlice.reducer;
