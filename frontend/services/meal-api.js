import axios from 'axios';

const BASE_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/meals`;;

export const createMeal = async (idToken, mealData) => {
  const response = await axios.post(`${BASE_URL}`, mealData, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const getAllMeals = async (idToken) => {
  const response = await axios.get(`${BASE_URL}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const getMealById = async (idToken, mealID) => {
  const response = await axios.get(`${BASE_URL}/${mealID}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const updateMeal = async (idToken, mealID, updatedMealData) => {
  const response = await axios.patch(`${BASE_URL}/${mealID}`, updatedMealData, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const deleteMeal = async (idToken, mealID) => {
  const response = await axios.delete(`${BASE_URL}/${mealID}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};
