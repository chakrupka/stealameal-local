import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import createErrorSlice from './error-slice';
import createUserSlice from './user-slice';
import createMealSlice from './meal-slice';
import createSquadSlice from './squad-slice';


const useStore = create(
  devtools(
    immer((...args) => ({
      errorSlice: createErrorSlice(...args),
      userSlice: createUserSlice(...args),
      mealSlice: createMealSlice(...args),
      squadSlice: createSquadSlice(...args),

    })),
  ),
);
export default useStore;
