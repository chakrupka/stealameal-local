import axios from 'axios';

const BASE_URL = `http://localhost:9090/api`;

export const createUser = async (userData) => {
  // For user creation, no token is needed as it's a public route
  const response = await axios.post(`${BASE_URL}/auth`, userData, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds timeout
  });
  return response.data;
};

export const fetchOwnUser = async (idToken) => {
  console.log('Fetching own user with token:', idToken);

  try {
    const response = await axios.get(`${BASE_URL}/auth`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });

    console.log('Fetch user response:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'Fetch user error:',
      error.response ? error.response.data : error,
    );
    throw error;
  }
};
export const searchUsersByEmail = async (idToken, email) => {
  console.log('API: Searching users');
  console.log('Email:', email);
  console.log('idToken:', idToken);

  try {
    const response = await axios.get(
      `${BASE_URL}/search-users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Search response:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Search error',
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
};
export const fetchPublicUser = async (idToken, idToFetch) => {
  const response = await axios.get(`${BASE_URL}/users/${idToFetch}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    timeout: 10000,
  });
  return response.data;
};

export const updateUser = async (idToken, userID, updatedUserData) => {
  const response = await axios.patch(
    `${BASE_URL}/users/${userID}`,
    updatedUserData,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      timeout: 10000,
    },
  );
  return response.data;
};

export const deleteUser = async (idToken, userID) => {
  const response = await axios.delete(`${BASE_URL}/users/${userID}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    timeout: 10000,
  });
  return response.data;
};

export const sendFriendRequest = async (idToken, senderID, receiverID) => {
  const response = await axios.post(
    `${BASE_URL}/users/send-friend-request`,
    { senderID, receiverID },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    },
  );
  return response.data;
};
export const getFriendRequests = async (idToken, userID) => {
  const response = await axios.get(
    `${BASE_URL}/users/${userID}/friend-requests`, // Fixed the path to match router.js
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      timeout: 10000,
    },
  );
  return response.data;
};
