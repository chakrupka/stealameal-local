import axios from 'axios';

const BASE_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

export const getOpenMeals = async (idToken) => {
  try {
    console.log('API: Fetching open meals');
    const response = await axios.get(`${BASE_URL}/meals/open`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    console.log('API: Fetched open meals:', response.data.length);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error fetching open meals:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const joinMeal = async (idToken, mealId) => {
  try {
    console.log('API: Joining meal:', mealId);
    const response = await axios.post(
      `${BASE_URL}/meals/${mealId}/join`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Successfully joined meal:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error joining meal:',
      error.response?.data || error.message,
    );
    throw error;
  }
};
