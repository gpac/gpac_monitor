import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { selectFilterNameById } from './graphSlice';
import { gpacService } from '@/services/gpacService';

export interface ArgumentUpdate {
  filterId: string;
  name: string;
  value: any;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
}

export interface FilterArgumentState {
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
  extraReducers: (builder) => {
    builder.addCase(updateFilterArgument.pending, (state, action) => {
      const { filterId, argName, argValue } = action.meta.arg;
      const key = `${filterId}_${argName}`;
      state.updates[key] = {
        filterId,
        name: argName,
        value: argValue,
        status: 'pending',
      };
    });
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
    const filterName = selectFilterNameById(getState() as any, filterId);

    if (!filterName) {
      throw new Error(`Filter with ID ${filterId} not found`);
    }

    // Send update to GPAC
    await gpacService.updateFilterArg(
      parseInt(filterId),
      filterName,
      argName,
      argValue,
    );

    // Mark as success immediately after sending
    dispatch(
      setArgumentUpdateStatus({
        filterId,
        name: argName,
        value: argValue,
        status: 'success',
      }),
    );

    // Clear success status immediately (optimistic update)
    setTimeout(() => {
      dispatch(
        setArgumentUpdateStatus({
          filterId,
          name: argName,
          value: argValue,
          status: 'idle',
        }),
      );
    }, 100);
  },
);

// Selectors are exported from selectors/gpacArgs/filterArgumentSelectors.ts
export {
  selectArgumentUpdate,
  makeSelectArgumentUpdatesForFilter,
} from '@/shared/store/selectors/gpacArgs/filterArgumentSelectors';

export default filterArgumentSlice.reducer;
