import axios from 'axios';

const BASE_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

// Helper function to convert date strings back to Date objects
const convertDatesInAvailability = (availability) => {
  if (!availability) return availability;

  const convertDatesInItems = (items) => {
    if (!Array.isArray(items)) return items;

    return items.map((item) => ({
      ...item,
      startTime: item.startTime ? new Date(item.startTime) : null,
      endTime: item.endTime ? new Date(item.endTime) : null,
      startDate: item.startDate ? new Date(item.startDate) : null,
      endDate: item.endDate ? new Date(item.endDate) : null,
      specificDate: item.specificDate ? new Date(item.specificDate) : null,
    }));
  };

  return {
    ...availability,
    classes: convertDatesInItems(availability.classes),
    sporting: convertDatesInItems(availability.sporting),
    extracurricular: convertDatesInItems(availability.extracurricular),
    other: convertDatesInItems(availability.other),
  };
};

export const updateAvailability = async (idToken, availability) => {
  try {
    console.log('API: Updating availability with data:', availability);
    const response = await axios.post(
      `${BASE_URL}/availability`,
      availability,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Availability updated successfully:', response.data);

    // Convert dates in the response
    const result = {
      ...response.data,
      availability: convertDatesInAvailability(response.data.availability),
    };

    return result;
  } catch (error) {
    console.error(
      'API: Error updating availability:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getAvailability = async (idToken) => {
  try {
    console.log('API: Fetching availability');
    const response = await axios.get(`${BASE_URL}/availability`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    console.log('API: Fetched availability:', response.data);

    // Convert dates in the response
    const result = {
      ...response.data,
      availability: convertDatesInAvailability(response.data.availability),
    };

    return result;
  } catch (error) {
    console.error(
      'API: Error fetching availability:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getFriendAvailability = async (idToken, friendUID) => {
  try {
    console.log(`API: Fetching availability for friend ${friendUID}`);
    const response = await axios.get(
      `${BASE_URL}/availability/friend/${friendUID}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Fetched friend availability:', response.data);

    // Convert dates in the response
    const result = {
      ...response.data,
      availability: convertDatesInAvailability(response.data.availability),
    };

    return result;
  } catch (error) {
    console.error(
      'API: Error fetching friend availability:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const checkAvailability = async (
  idToken,
  userIDs,
  date,
  startTime,
  endTime,
) => {
  try {
    console.log('API: Checking availability for users:', userIDs);
    const response = await axios.post(
      `${BASE_URL}/availability/check`,
      {
        userIDs,
        date,
        startTime,
        endTime,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Availability check results:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error checking availability:',
      error.response?.data || error.message,
    );
    throw error;
  }
};
