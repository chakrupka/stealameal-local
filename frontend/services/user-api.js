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
  try {
    const response = await axios.get(`${BASE_URL}/auth`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });

    // Log the raw response
    console.log(
      'Raw user data from server:',
      JSON.stringify(response.data, null, 2),
    );

    // Ensure userID exists
    if (response.data && !response.data.userID) {
      console.warn('Warning: User data missing userID field!');

      // Ask your backend developer to fix this issue
      // As a temporary workaround, you can try to get the userID from the token
      // But this is not a recommended long-term solution

      // DO NOT use MongoDB _id as userID - they're completely different
    }

    return response.data;
  } catch (error) {
    console.error('Fetch user error:', error);
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

export const sendFriendRequest = async (
  idToken,
  senderID,
  senderName,
  senderEmail,
  receiverID,
) => {
  console.log('API: Sending friend request with params:', {
    senderID,
    senderName,
    senderEmail,
    receiverID,
  });

  try {
    const response = await axios.post(
      `${BASE_URL}/users/send-friend-request`,
      {
        senderID,
        senderName,
        senderEmail,
        receiverID,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Friend request response:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error sending friend request:',
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
};
export const acceptFriendRequest = async (idToken, receiverID, senderID) => {
  console.log('API: Accepting friend request with params:', {
    receiverID,
    senderID,
  });

  try {
    const response = await axios.post(
      `${BASE_URL}/users/accept-friend-request`,
      {
        receiverID,
        senderID,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Friend request accepted response:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error accepting friend request:',
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
};
export const fetchFriendDetails = async (idToken, friendID) => {
  console.log(
    `API: Fetching details for friend with Firebase UID: ${friendID}`,
  );

  try {
    const response = await axios.get(
      `${BASE_URL}/users/by-firebase-uid/${friendID}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      },
    );

    console.log('API: Friend details response:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error fetching friend details:',
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
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
