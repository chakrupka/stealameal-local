import axios from 'axios';

const BASE_URL = `http://localhost:9090/api/squads`;

export const createSquad = async (idToken, squadData) => {
  try {
    console.log('API: Creating squad with data:', squadData);
    const response = await axios.post(`${BASE_URL}`, squadData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    console.log('API: Squad created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error creating squad:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getAllSquads = async (idToken) => {
  try {
    console.log('API: Fetching all squads');
    const response = await axios.get(`${BASE_URL}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    console.log('API: Fetched squads:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error fetching squads:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getSquadById = async (idToken, squadID) => {
  try {
    console.log(`API: Fetching squad with ID: ${squadID}`);
    const response = await axios.get(`${BASE_URL}/${squadID}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    console.log('API: Fetched squad details:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error fetching squad:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const deleteSquad = async (idToken, squadID) => {
  try {
    console.log(`API: Deleting squad with ID: ${squadID}`);
    const response = await axios.delete(`${BASE_URL}/${squadID}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    console.log('API: Squad deleted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error deleting squad:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const addMemberToSquad = async (idToken, squadID, userID) => {
  try {
    console.log(`API: Adding member ${userID} to squad ${squadID}`);
    const response = await axios.post(
      `${BASE_URL}/${squadID}/members`,
      { userID },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Member added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error adding member:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const removeMemberFromSquad = async (idToken, squadID, userID) => {
  try {
    console.log(`API: Removing member ${userID} from squad ${squadID}`);
    const response = await axios.delete(
      `${BASE_URL}/${squadID}/members/${userID}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );
    console.log('API: Member removed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error removing member:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getUserSquads = async (idToken, userID) => {
  try {
    console.log(`API: Fetching squads for user ${userID}`);
    const response = await axios.get(`${BASE_URL}/user/${userID}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    console.log('API: Fetched user squads:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'API: Error fetching user squads:',
      error.response?.data || error.message,
    );
    throw error;
  }
};
