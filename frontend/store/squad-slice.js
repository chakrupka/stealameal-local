import * as Auth from '../services/firebase-auth';
import * as Api from '../services/squad-api';

const createSquadSlice = (set, get) => ({
  squads: [],
  selectedSquad: null,

  createSquad: async (squadData) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      const newSquad = await Api.createSquad(idToken, squadData);
      set(
        (state) => {
          state.squadSlice.squads.push(newSquad);
        },
        false,
        'squad/createSquad',
      );
      return newSquad;
    } catch (err) {
      console.error('Error creating squad:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  getAllSquads: async () => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      const squads = await Api.getAllSquads(idToken);
      set(
        (state) => {
          state.squadSlice.squads = squads;
        },
        false,
        'squad/getAllSquads',
      );
      return squads;
    } catch (err) {
      console.error('Error fetching all squads:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  getSquadById: async (squadID) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      const squad = await Api.getSquadById(idToken, squadID);
      set(
        (state) => {
          state.squadSlice.selectedSquad = squad;
        },
        false,
        'squad/getSquadById',
      );
      return squad;
    } catch (err) {
      console.error('Error fetching squad by ID:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  deleteSquad: async (squadID) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      await Api.deleteSquad(idToken, squadID);
      set(
        (state) => {
          state.squadSlice.squads = state.squadSlice.squads.filter(
            (squad) => squad._id !== squadID,
          );
        },
        false,
        'squad/deleteSquad',
      );
      return true;
    } catch (err) {
      console.error('Error deleting squad:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  addMemberToSquad: async (squadID, userID) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      const updatedSquad = await Api.addMemberToSquad(idToken, squadID, userID);
      set(
        (state) => {
          state.squadSlice.selectedSquad = updatedSquad;
        },
        false,
        'squad/addMemberToSquad',
      );
      return updatedSquad;
    } catch (err) {
      console.error('Error adding member to squad:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  removeMemberFromSquad: async (squadID, userID) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      const updatedSquad = await Api.removeMemberFromSquad(idToken, squadID, userID);
      set(
        (state) => {
          state.squadSlice.selectedSquad = updatedSquad;
        },
        false,
        'squad/removeMemberFromSquad',
      );
      return updatedSquad;
    } catch (err) {
      console.error('Error removing member from squad:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },
});

export default createSquadSlice;
