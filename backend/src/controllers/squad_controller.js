import Squad from '../models/squad_model';
import User from '../models/user_model';

// Create new squad
const createSquad = async (req, res) => {
  try {
    const { squadName, members, description, squadImage } = req.body;

    // Ensure current user is the creator
    const createdBy = req.verifiedAuthId; // This is the Firebase UID from the auth middleware

    // Validate the input
    if (!squadName || !members || members.length === 0) {
      return res.status(400).json({
        error: 'Invalid squad data',
        message: 'Squad name and at least one member are required',
      });
    }

    // Make sure the creator is included in members
    const memberList = members.includes(createdBy)
      ? members
      : [...members, createdBy];

    // Create the squad with Firebase UIDs
    const newSquad = new Squad({
      squadName,
      members: memberList,
      createdBy,
      description: description || '',
      squadImage: squadImage || null,
      lastActive: new Date(),
    });

    // Save to database
    await newSquad.save();
    console.log('Squad created:', newSquad);

    return res.status(201).json(newSquad);
  } catch (error) {
    console.error('Error creating squad:', error);
    return res.status(500).json({
      error: 'Failed to create squad',
      message: error.message,
    });
  }
};

// Get all squads (with optional filtering)
const getAllSquads = async (req, res) => {
  try {
    // Get the current user's Firebase UID from the auth middleware
    const currentUserId = req.verifiedAuthId;

    // Find all squads where the current user is a member
    const squads = await Squad.find({ members: currentUserId }).sort({
      lastActive: -1,
    }); // Sort by most recently active

    console.log(`Found ${squads.length} squads for user ${currentUserId}`);
    return res.json(squads);
  } catch (error) {
    console.error('Error fetching squads:', error);
    return res.status(500).json({
      error: 'Failed to fetch squads',
      message: error.message,
    });
  }
};

// Get squads for a specific user
const getUserSquads = async (req, res) => {
  try {
    const { userID } = req.params;

    // Find all squads where the specified user is a member
    const squads = await Squad.find({ members: userID }).sort({
      lastActive: -1,
    }); // Sort by most recently active

    console.log(`Found ${squads.length} squads for user ${userID}`);
    return res.json(squads);
  } catch (error) {
    console.error('Error fetching user squads:', error);
    return res.status(500).json({
      error: 'Failed to fetch user squads',
      message: error.message,
    });
  }
};

// Get squad by ID with member details
const getSquadById = async (req, res) => {
  try {
    const { squadID } = req.params;

    // Get the current user's Firebase UID from the auth middleware
    const currentUserId = req.verifiedAuthId;

    // Find the squad
    const squad = await Squad.findById(squadID);

    if (!squad) {
      return res.status(404).json({
        error: 'Squad not found',
        message: 'No squad exists with the provided ID',
      });
    }

    // Check if the current user is a member of the squad
    if (!squad.members.includes(currentUserId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this squad',
      });
    }

    // Get user details for all members
    const memberDetails = await Promise.all(
      squad.members.map(async (memberID) => {
        const member = await User.findOne(
          { userID: memberID },
          'firstName lastName email profilePic userID',
        );
        return member || { userID: memberID, name: 'Unknown User' };
      }),
    );

    // Add member details to the response
    const squadWithMembers = {
      ...squad.toObject(),
      memberDetails,
    };

    return res.json(squadWithMembers);
  } catch (error) {
    console.error('Error fetching squad:', error);
    return res.status(500).json({
      error: 'Failed to fetch squad details',
      message: error.message,
    });
  }
};

// Update a squad
const updateSquad = async (req, res) => {
  try {
    const { squadID } = req.params;
    const { squadName, description, squadImage } = req.body;

    // Get the current user's Firebase UID from the auth middleware
    const currentUserId = req.verifiedAuthId;

    // Find the squad
    const squad = await Squad.findById(squadID);

    if (!squad) {
      return res.status(404).json({
        error: 'Squad not found',
        message: 'No squad exists with the provided ID',
      });
    }

    if (squad.createdBy !== currentUserId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the squad creator can update squad details',
      });
    }

    if (squadName) squad.squadName = squadName;
    if (description !== undefined) squad.description = description;
    if (squadImage !== undefined) squad.squadImage = squadImage;

    squad.lastActive = new Date();

    await squad.save();

    return res.json(squad);
  } catch (error) {
    console.error('Error updating squad:', error);
    return res.status(500).json({
      error: 'Failed to update squad',
      message: error.message,
    });
  }
};

const addMemberToSquad = async (req, res) => {
  try {
    const { squadID } = req.params;
    const { userID } = req.body;

    const currentUserId = req.verifiedAuthId;

    const squad = await Squad.findById(squadID);

    if (!squad) {
      return res.status(404).json({
        error: 'Squad not found',
        message: 'No squad exists with the provided ID',
      });
    }

    if (!squad.members.includes(currentUserId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You must be a member of the squad to add others',
      });
    }

    const userToAdd = await User.findOne({ userID });
    if (!userToAdd) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The user you are trying to add does not exist',
      });
    }

    if (squad.members.includes(userID)) {
      return res.status(400).json({
        error: 'Already a member',
        message: 'This user is already a member of the squad',
      });
    }

    squad.members.push(userID);

    squad.lastActive = new Date();

    await squad.save();

    return res.json(squad);
  } catch (error) {
    console.error('Error adding member to squad:', error);
    return res.status(500).json({
      error: 'Failed to add member to squad',
      message: error.message,
    });
  }
};

const removeMemberFromSquad = async (req, res) => {
  try {
    const { squadID, userID } = req.params;

    const currentUserId = req.verifiedAuthId;

    const squad = await Squad.findById(squadID);

    if (!squad) {
      return res.status(404).json({
        error: 'Squad not found',
        message: 'No squad exists with the provided ID',
      });
    }

    // Check if the current user is the creator or the user being removed
    const isCreator = squad.createdBy === currentUserId;
    const isSelfRemoval = userID === currentUserId;

    if (!isCreator && !isSelfRemoval) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the squad creator can remove other members',
      });
    }

    if (isSelfRemoval && isCreator) {
      if (squad.members.length > 1) {
        return res.status(400).json({
          error: 'Creator cannot leave',
          message:
            'The squad creator must delete the squad or transfer ownership first',
        });
      } else {
        // The creator is the only member, so delete the squad instead
        await Squad.findByIdAndDelete(squadID);
        return res.json({
          message: 'Squad deleted as you were the only member',
        });
      }
    }

    // Remove the user from the squad
    squad.members = squad.members.filter((member) => member !== userID);

    squad.lastActive = new Date();

    await squad.save();

    return res.json(squad);
  } catch (error) {
    console.error('Error removing member from squad:', error);
    return res.status(500).json({
      error: 'Failed to remove member from squad',
      message: error.message,
    });
  }
};

const deleteSquad = async (req, res) => {
  try {
    const { squadID } = req.params;

    // Get the current user's Firebase UID from the auth middleware
    const currentUserId = req.verifiedAuthId;

    const squad = await Squad.findById(squadID);

    if (!squad) {
      return res.status(404).json({
        error: 'Squad not found',
        message: 'No squad exists with the provided ID',
      });
    }

    if (squad.createdBy !== currentUserId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the squad creator can delete the squad',
      });
    }

    await Squad.findByIdAndDelete(squadID);

    return res.json({
      message: 'Squad deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting squad:', error);
    return res.status(500).json({
      error: 'Failed to delete squad',
      message: error.message,
    });
  }
};

export default {
  createSquad,
  getAllSquads,
  getUserSquads,
  getSquadById,
  updateSquad,
  addMemberToSquad,
  removeMemberFromSquad,
  deleteSquad,
};
