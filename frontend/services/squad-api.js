import axios from 'axios';
import Config from 'react-native-config';

const BASE_URL = `http://localhost:9090/api`;

export const createSquad = async (idToken, squadData) => {
  const response = await axios.post(`${BASE_URL}`, squadData, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const getAllSquads = async (idToken) => {
  const response = await axios.get(`${BASE_URL}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const getSquadById = async (idToken, squadID) => {
  const response = await axios.get(`${BASE_URL}/${squadID}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const deleteSquad = async (idToken, squadID) => {
  const response = await axios.delete(`${BASE_URL}/${squadID}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response.data;
};

export const addMemberToSquad = async (idToken, squadID, userID) => {
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
  return response.data;
};

export const removeMemberFromSquad = async (idToken, squadID, userID) => {
  const response = await axios.delete(
    `${BASE_URL}/${squadID}/members/${userID}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    },
  );
  return response.data;
};
