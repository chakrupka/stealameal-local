import * as Auth from '../services/firebase-auth';
import * as Api from '../services/meal-api';
import * as StealMealApi from '../services/steal-meal-api';

const createMealSlice = (set, get) => ({
  meals: [],
  selectedMeal: null,
  loading: false,
  error: null,
  openMeals: [],
  openMealsLoading: false,
  // Reset error state
  resetError: () => {
    set(
      (state) => {
        state.mealSlice.error = null;
      },
      false,
      'meal/resetError',
    );
  },
  getOpenMeals: async () => {
    try {
      set(
        (state) => {
          state.mealSlice.openMealsLoading = true;
          state.mealSlice.error = null;
        },
        false,
        'meal/getOpenMeals/pending',
      );

      const idToken = await Auth.getUser().getIdToken();
      const openMeals = await StealMealApi.getOpenMeals(idToken);

      set(
        (state) => {
          state.mealSlice.openMeals = openMeals;
          state.mealSlice.openMealsLoading = false;
        },
        false,
        'meal/getOpenMeals/fulfilled',
      );

      return openMeals;
    } catch (err) {
      console.error('Error fetching open meals:', err);

      set(
        (state) => {
          state.mealSlice.openMealsLoading = false;
          state.mealSlice.error = err.message || 'Failed to fetch open meals';
        },
        false,
        'meal/getOpenMeals/rejected',
      );

      get().errorSlice?.newError?.(err);
      throw err;
    }
  },

  joinOpenMeal: async (mealId) => {
    try {
      set(
        (state) => {
          state.mealSlice.loading = true;
          state.mealSlice.error = null;
        },
        false,
        'meal/joinOpenMeal/pending',
      );

      const idToken = await Auth.getUser().getIdToken();
      const result = await StealMealApi.joinMeal(idToken, mealId);

      set(
        (state) => {
          // Remove from open meals list
          state.mealSlice.openMeals = state.mealSlice.openMeals.filter(
            (meal) => meal._id !== mealId,
          );

          // Add to user's meals
          if (result.meal) {
            state.mealSlice.meals.push(result.meal);
          }

          state.mealSlice.loading = false;
        },
        false,
        'meal/joinOpenMeal/fulfilled',
      );

      return result;
    } catch (err) {
      console.error('Error joining meal:', err);

      set(
        (state) => {
          state.mealSlice.loading = false;
          state.mealSlice.error = err.message || 'Failed to join meal';
        },
        false,
        'meal/joinOpenMeal/rejected',
      );

      get().errorSlice?.newError?.(err);
      throw err;
    }
  },
  createMeal: async (mealData) => {
    try {
      set(
        (state) => {
          state.mealSlice.loading = true;
          state.mealSlice.error = null;
        },
        false,
        'meal/createMeal/pending',
      );

      const idToken = await Auth.getUser().getIdToken();
      console.log(
        'Creating meal with data:',
        JSON.stringify(mealData, null, 2),
      );

      const newMeal = await Api.createMeal(idToken, mealData);

      set(
        (state) => {
          state.mealSlice.meals.push(newMeal);
          state.mealSlice.loading = false;
        },
        false,
        'meal/createMeal/fulfilled',
      );

      return newMeal;
    } catch (err) {
      console.error('Error creating meal:', err);

      set(
        (state) => {
          state.mealSlice.loading = false;
          state.mealSlice.error = err.message || 'Failed to create meal';
        },
        false,
        'meal/createMeal/rejected',
      );

      get().errorSlice?.newError?.(err);
      throw err;
    }
  },

  getAllMeals: async () => {
    try {
      set(
        (state) => {
          state.mealSlice.loading = true;
          state.mealSlice.error = null;
        },
        false,
        'meal/getAllMeals/pending',
      );

      const idToken = await Auth.getUser().getIdToken();
      const meals = await Api.getAllMeals(idToken);

      console.log(`Retrieved ${meals.length} meals from API`);

      set(
        (state) => {
          state.mealSlice.meals = meals;
          state.mealSlice.loading = false;
        },
        false,
        'meal/getAllMeals/fulfilled',
      );

      return meals;
    } catch (err) {
      console.error('Error fetching all meals:', err);

      set(
        (state) => {
          state.mealSlice.loading = false;
          state.mealSlice.error = err.message || 'Failed to fetch meals';
        },
        false,
        'meal/getAllMeals/rejected',
      );

      get().errorSlice?.newError?.(err);
      throw err;
    }
  },

  getMealById: async (mealID) => {
    try {
      set(
        (state) => {
          state.mealSlice.loading = true;
          state.mealSlice.error = null;
        },
        false,
        'meal/getMealById/pending',
      );

      const idToken = await Auth.getUser().getIdToken();
      const meal = await Api.getMealById(idToken, mealID);

      set(
        (state) => {
          state.mealSlice.selectedMeal = meal;
          state.mealSlice.loading = false;
        },
        false,
        'meal/getMealById/fulfilled',
      );

      return meal;
    } catch (err) {
      console.error('Error fetching meal by ID:', err);

      set(
        (state) => {
          state.mealSlice.loading = false;
          state.mealSlice.error = err.message || 'Failed to fetch meal details';
        },
        false,
        'meal/getMealById/rejected',
      );

      get().errorSlice?.newError?.(err);
      throw err;
    }
  },

  updateMeal: async (mealID, updatedMealData) => {
    try {
      set(
        (state) => {
          state.mealSlice.loading = true;
          state.mealSlice.error = null;
        },
        false,
        'meal/updateMeal/pending',
      );

      const idToken = await Auth.getUser().getIdToken();
      console.log(
        'Updating meal with data:',
        JSON.stringify(updatedMealData, null, 2),
      );

      const updatedMeal = await Api.updateMeal(
        idToken,
        mealID,
        updatedMealData,
      );

      set(
        (state) => {
          // Update the meal in the meals array
          state.mealSlice.meals = state.mealSlice.meals.map((meal) =>
            meal._id === updatedMeal._id ? updatedMeal : meal,
          );

          // If the selected meal is the one being updated, update it too
          if (
            state.mealSlice.selectedMeal &&
            state.mealSlice.selectedMeal._id === updatedMeal._id
          ) {
            state.mealSlice.selectedMeal = updatedMeal;
          }

          state.mealSlice.loading = false;
        },
        false,
        'meal/updateMeal/fulfilled',
      );

      return updatedMeal;
    } catch (err) {
      console.error('Error updating meal:', err);

      set(
        (state) => {
          state.mealSlice.loading = false;
          state.mealSlice.error = err.message || 'Failed to update meal';
        },
        false,
        'meal/updateMeal/rejected',
      );

      get().errorSlice?.newError?.(err);
      throw err;
    }
  },

  deleteMeal: async (mealID) => {
    try {
      set(
        (state) => {
          state.mealSlice.loading = true;
          state.mealSlice.error = null;
        },
        false,
        'meal/deleteMeal/pending',
      );

      const idToken = await Auth.getUser().getIdToken();
      await Api.deleteMeal(idToken, mealID);

      set(
        (state) => {
          // Remove the meal from the meals array
          state.mealSlice.meals = state.mealSlice.meals.filter(
            (meal) => meal._id !== mealID,
          );

          // If the selected meal is the one being deleted, clear it
          if (
            state.mealSlice.selectedMeal &&
            state.mealSlice.selectedMeal._id === mealID
          ) {
            state.mealSlice.selectedMeal = null;
          }

          state.mealSlice.loading = false;
        },
        false,
        'meal/deleteMeal/fulfilled',
      );

      return true;
    } catch (err) {
      console.error('Error deleting meal:', err);

      set(
        (state) => {
          state.mealSlice.loading = false;
          state.mealSlice.error = err.message || 'Failed to delete meal';
        },
        false,
        'meal/deleteMeal/rejected',
      );

      get().errorSlice?.newError?.(err);
      throw err;
    }
  },
});

export default createMealSlice;
