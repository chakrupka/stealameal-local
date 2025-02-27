const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const BACKEND_URL = `${BASE_URL}/api`;

export const createUser = async (idToken, userData) => {
  const response = await axios.post(`${BACKEND_URL}/auth`, userData, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const fetchOwnUser = async (idToken) => {
  const response = await axios.get(`${BACKEND_URL}/auth`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const fetchPublicUser = async (idToken, idToFetch) => {
  const response = await axios.get(`${BACKEND_URL}/users/${idToFetch}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const temp = null;
