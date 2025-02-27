import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import createErrorSlice from './error-slice';
import createUserSlice from './user-slice';

const useStore = create(
  devtools(
    immer((...args) => ({
      errorSlice: createErrorSlice(...args),
      userSlice: createUserSlice(...args),
    })),
  ),
);
export default useStore;
