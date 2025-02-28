import * as Auth from '../services/firebase-auth';
import * as Api from '../services/meal-api';

const createMealSlice = (set, get) => ({
  meals: [],
  selectedMeal: null,

  createMeal: async (mealData) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      const newMeal = await Api.createMeal(idToken, mealData);
      set(
        (state) => {
          state.mealSlice.meals.push(newMeal);
        },
        false,
        'meal/createMeal',
      );
      return newMeal;
    } catch (err) {
      console.error('Error creating meal:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  getAllMeals: async () => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      const meals = await Api.getAllMeals(idToken);
      set(
        (state) => {
          state.mealSlice.meals = meals;
        },
        false,
        'meal/getAllMeals',
      );
      return meals;
    } catch (err) {
      console.error('Error fetching all meals:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  getMealById: async (mealID) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      const meal = await Api.getMealById(idToken, mealID);
      set(
        (state) => {
          state.mealSlice.selectedMeal = meal;
        },
        false,
        'meal/getMealById',
      );
      return meal;
    } catch (err) {
      console.error('Error fetching meal by ID:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  updateMeal: async (mealID, updatedMealData) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      const updatedMeal = await Api.updateMeal(
        idToken,
        mealID,
        updatedMealData,
      );
      set(
        (state) => {
          state.mealSlice.meals = state.mealSlice.meals.map((meal) =>
            meal._id === updatedMeal._id ? updatedMeal : meal,
          );
        },
        false,
        'meal/updateMeal',
      );
      return updatedMeal;
    } catch (err) {
      console.error('Error updating meal:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  deleteMeal: async (mealID) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      await Api.deleteMeal(idToken, mealID);
      set(
        (state) => {
          state.mealSlice.meals = state.mealSlice.meals.filter(
            (meal) => meal._id !== mealID,
          );
        },
        false,
        'meal/deleteMeal',
      );
      return true;
    } catch (err) {
      console.error('Error deleting meal:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },
});

export default createMealSlice;
