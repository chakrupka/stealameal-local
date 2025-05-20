import axios from 'axios';
const BASE_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/pings`;


export const sendPing = async (idToken, pingData) => {
  try {
    console.log('API: Sending ping with data:', pingData);
    const response = await axios.post(`${BASE_URL}`, pingData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    console.log('API: Ping sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error sending ping:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getActivePings = async (idToken) => {
  try {
    console.log('API: Fetching active pings');
    const response = await axios.get(`${BASE_URL}/active`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    console.log('API: Fetched active pings:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error fetching pings:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const respondToPing = async (idToken, pingId, response) => {
  try {
    console.log(`API: Responding to ping ${pingId} with "${response}"`);
    const responseData = { response };
    const apiResponse = await axios.post(
      `${BASE_URL}/${pingId}/respond`,
      responseData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Ping response sent successfully:', apiResponse.data);
    return apiResponse.data;
  } catch (error) {
    console.error(
      'API: Error responding to ping:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const dismissPing = async (idToken, pingId) => {
  try {
    console.log(`API: Dismissing ping ${pingId}`);
    const response = await axios.post(
      `${BASE_URL}/${pingId}/dismiss`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Ping dismissed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error dismissing ping:',
      error.response?.data || error.message,
    );
    throw error;
  }
};
