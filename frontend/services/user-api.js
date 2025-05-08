import axios from 'axios';
const BASE_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

export const createUser = async (userData) => {
  // no token is needed as it's a public route
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

    // Ensure userID exists
    if (response.data && !response.data.userID) {
      console.warn('Warning: User data missing userID field!');
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

export const updateUserLocation = async (idToken, userID, location) => {
  console.log(`API: Updating location for user ${userID} to ${location}`);

  try {
    const response = await axios.patch(
      `${BASE_URL}/users/${userID}/location`,
      { location },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      'API: Error updating location:',
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
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

    if (response.data.locationUpdatedAt) {
      try {
        const date = new Date(response.data.locationUpdatedAt);

        if (isNaN(date.getTime())) {
          delete response.data.locationUpdatedAt;
        } else {
          // Ensure it's stored as ISO string
          response.data.locationUpdatedAt = date.toISOString();
        }
      } catch (err) {
        delete response.data.locationUpdatedAt;
      }
    }

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
    `${BASE_URL}/users/${userID}/friend-requests`,
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

export const fixLocationTimestamps = async (idToken) => {
  try {
    console.log('API: Fixing missing location timestamps');

    const response = await axios.post(
      `${BASE_URL}/fix-location-timestamps`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 30000,
      },
    );

    console.log('API: Fix response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error fixing timestamps:', error);
    throw error;
  }
};
