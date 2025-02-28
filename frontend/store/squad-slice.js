import * as Auth from '../services/firebase-auth';
import * as Api from '../services/squad-api';

const createSquadSlice = (set, get) => ({
  squads: [],
  selectedSquad: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,

  createSquad: async (squadData) => {
    set(
      (state) => {
        state.squadSlice.status = 'loading';
        state.squadSlice.error = null;
      },
      false,
      'squad/createSquad/pending',
    );

    try {
      // Get current Firebase user's ID token
      const user = Auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create a squad');
      }

      const idToken = await user.getIdToken();
      const newSquad = await Api.createSquad(idToken, squadData);

      set(
        (state) => {
          state.squadSlice.squads.push(newSquad);
          state.squadSlice.status = 'succeeded';
        },
        false,
        'squad/createSquad/fulfilled',
      );
      return newSquad;
    } catch (err) {
      console.error('Error creating squad:', err);
      set(
        (state) => {
          state.squadSlice.status = 'failed';
          state.squadSlice.error = err.message || 'Failed to create squad';
        },
        false,
        'squad/createSquad/rejected',
      );
      throw err;
    }
  },

  getAllSquads: async () => {
    set(
      (state) => {
        state.squadSlice.status = 'loading';
        state.squadSlice.error = null;
      },
      false,
      'squad/getAllSquads/pending',
    );

    try {
      const user = Auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to fetch squads');
      }

      const idToken = await user.getIdToken();
      const squads = await Api.getAllSquads(idToken);

      set(
        (state) => {
          state.squadSlice.squads = squads;
          state.squadSlice.status = 'succeeded';
        },
        false,
        'squad/getAllSquads/fulfilled',
      );
      return squads;
    } catch (err) {
      console.error('Error fetching all squads:', err);
      set(
        (state) => {
          state.squadSlice.status = 'failed';
          state.squadSlice.error = err.message || 'Failed to fetch squads';
        },
        false,
        'squad/getAllSquads/rejected',
      );
      throw err;
    }
  },

  getUserSquads: async (userID) => {
    set(
      (state) => {
        state.squadSlice.status = 'loading';
        state.squadSlice.error = null;
      },
      false,
      'squad/getUserSquads/pending',
    );

    try {
      const user = Auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to fetch your squads');
      }

      const idToken = await user.getIdToken();
      // If no userID is provided, use the current user's ID
      const targetUserID = userID || get().userSlice.currentUser.userID;

      const squads = await Api.getUserSquads(idToken, targetUserID);

      set(
        (state) => {
          state.squadSlice.squads = squads;
          state.squadSlice.status = 'succeeded';
        },
        false,
        'squad/getUserSquads/fulfilled',
      );
      return squads;
    } catch (err) {
      console.error('Error fetching user squads:', err);
      set(
        (state) => {
          state.squadSlice.status = 'failed';
          state.squadSlice.error = err.message || 'Failed to fetch your squads';
        },
        false,
        'squad/getUserSquads/rejected',
      );
      throw err;
    }
  },

  getSquadById: async (squadID) => {
    set(
      (state) => {
        state.squadSlice.status = 'loading';
        state.squadSlice.error = null;
      },
      false,
      'squad/getSquadById/pending',
    );

    try {
      const user = Auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to fetch squad details');
      }

      const idToken = await user.getIdToken();
      const squad = await Api.getSquadById(idToken, squadID);

      set(
        (state) => {
          state.squadSlice.selectedSquad = squad;
          state.squadSlice.status = 'succeeded';
        },
        false,
        'squad/getSquadById/fulfilled',
      );
      return squad;
    } catch (err) {
      console.error('Error fetching squad by ID:', err);
      set(
        (state) => {
          state.squadSlice.status = 'failed';
          state.squadSlice.error =
            err.message || 'Failed to fetch squad details';
        },
        false,
        'squad/getSquadById/rejected',
      );
      throw err;
    }
  },

  deleteSquad: async (squadID) => {
    set(
      (state) => {
        state.squadSlice.status = 'loading';
        state.squadSlice.error = null;
      },
      false,
      'squad/deleteSquad/pending',
    );

    try {
      const user = Auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to delete a squad');
      }

      const idToken = await user.getIdToken();
      await Api.deleteSquad(idToken, squadID);

      set(
        (state) => {
          state.squadSlice.squads = state.squadSlice.squads.filter(
            (squad) => squad._id !== squadID,
          );
          // If the deleted squad was selected, clear the selection
          if (
            state.squadSlice.selectedSquad &&
            state.squadSlice.selectedSquad._id === squadID
          ) {
            state.squadSlice.selectedSquad = null;
          }
          state.squadSlice.status = 'succeeded';
        },
        false,
        'squad/deleteSquad/fulfilled',
      );
      return true;
    } catch (err) {
      console.error('Error deleting squad:', err);
      set(
        (state) => {
          state.squadSlice.status = 'failed';
          state.squadSlice.error = err.message || 'Failed to delete squad';
        },
        false,
        'squad/deleteSquad/rejected',
      );
      throw err;
    }
  },

  addMemberToSquad: async (squadID, userID) => {
    set(
      (state) => {
        state.squadSlice.status = 'loading';
        state.squadSlice.error = null;
      },
      false,
      'squad/addMemberToSquad/pending',
    );

    try {
      const user = Auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to add members to a squad');
      }

      const idToken = await user.getIdToken();
      const updatedSquad = await Api.addMemberToSquad(idToken, squadID, userID);

      set(
        (state) => {
          state.squadSlice.selectedSquad = updatedSquad;

          // Also update the squad in the squads array
          const squadIndex = state.squadSlice.squads.findIndex(
            (s) => s._id === squadID,
          );
          if (squadIndex !== -1) {
            state.squadSlice.squads[squadIndex] = updatedSquad;
          }

          state.squadSlice.status = 'succeeded';
        },
        false,
        'squad/addMemberToSquad/fulfilled',
      );
      return updatedSquad;
    } catch (err) {
      console.error('Error adding member to squad:', err);
      set(
        (state) => {
          state.squadSlice.status = 'failed';
          state.squadSlice.error =
            err.message || 'Failed to add member to squad';
        },
        false,
        'squad/addMemberToSquad/rejected',
      );
      throw err;
    }
  },

  removeMemberFromSquad: async (squadID, userID) => {
    set(
      (state) => {
        state.squadSlice.status = 'loading';
        state.squadSlice.error = null;
      },
      false,
      'squad/removeMemberFromSquad/pending',
    );

    try {
      const user = Auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to remove members from a squad');
      }

      const idToken = await user.getIdToken();
      const updatedSquad = await Api.removeMemberFromSquad(
        idToken,
        squadID,
        userID,
      );

      set(
        (state) => {
          state.squadSlice.selectedSquad = updatedSquad;

          // Also update the squad in the squads array
          const squadIndex = state.squadSlice.squads.findIndex(
            (s) => s._id === squadID,
          );
          if (squadIndex !== -1) {
            state.squadSlice.squads[squadIndex] = updatedSquad;
          }

          state.squadSlice.status = 'succeeded';
        },
        false,
        'squad/removeMemberFromSquad/fulfilled',
      );
      return updatedSquad;
    } catch (err) {
      console.error('Error removing member from squad:', err);
      set(
        (state) => {
          state.squadSlice.status = 'failed';
          state.squadSlice.error =
            err.message || 'Failed to remove member from squad';
        },
        false,
        'squad/removeMemberFromSquad/rejected',
      );
      throw err;
    }
  },
});

export default createSquadSlice;
