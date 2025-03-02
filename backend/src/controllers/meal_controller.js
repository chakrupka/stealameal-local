import Meal from '../models/meal_model';
import User from '../models/user_model';
import Squad from '../models/squad_model';
import mongoose from 'mongoose';

const createMeal = async (req, res) => {
  try {
    console.log('Creating meal with data:', JSON.stringify(req.body, null, 2));

    // Get authenticated user ID
    const authenticatedUserId = req.verifiedAuthId;
    console.log('Authenticated user ID:', authenticatedUserId);

    // Find user in MongoDB - first check if host is provided in request
    let hostId = req.body.host;

    // If no host is provided, use the authenticated user
    if (!hostId) {
      const user = await User.findOne({ userID: authenticatedUserId });
      if (!user) {
        return res.status(404).json({ error: 'Host user not found' });
      }
      hostId = user._id;
      req.body.host = hostId;
    }

    // Process squads if they exist in the request
    const mealData = { ...req.body };

    if (mealData.squadIds && mealData.squadIds.length > 0) {
      console.log('Processing squads for meal:', mealData.squadIds);

      // Fetch the squad data to verify existence and get members
      const squads = await Squad.find({ _id: { $in: mealData.squadIds } });

      if (squads.length !== mealData.squadIds.length) {
        return res.status(400).json({ error: 'One or more squads not found' });
      }

      // Format squads for the meal model
      mealData.squads = squads.map((squad) => ({
        squadID: squad._id,
        status: 'invited',
      }));

      // Get unique squad members and add them as individual participants
      const squadMembers = new Set();
      for (const squad of squads) {
        for (const memberId of squad.members) {
          // Find MongoDB _id for the Firebase UID
          const member = await User.findOne({ userID: memberId });
          if (member) {
            squadMembers.add(member._id.toString());
          }
        }
      }

      // Create participant entries for squad members
      const squadParticipants = Array.from(squadMembers).map((userId) => ({
        userID: userId,
        status: 'invited',
      }));

      // Combine with any existing participants
      if (!mealData.participants) {
        mealData.participants = [];
      }

      // Add squad members as participants if they're not already included
      for (const squadParticipant of squadParticipants) {
        const exists = mealData.participants.some(
          (p) => p.userID.toString() === squadParticipant.userID.toString(),
        );

        if (!exists) {
          mealData.participants.push(squadParticipant);
        }
      }

      // Remove the squadIds field as it's not part of the model
      delete mealData.squadIds;
    }

    // Create new meal
    const newMeal = new Meal(mealData);

    // Add meal to host's mealsScheduled array
    const hostUser = await User.findById(hostId);
    if (hostUser) {
      hostUser.mealsScheduled.push(newMeal._id);
      await hostUser.save();
    }

    // Save the meal
    await newMeal.save();

    // Return the populated meal with user details
    const populatedMeal = await Meal.findById(newMeal._id)
      .populate('host', 'firstName lastName email userID')
      .populate('participants.userID', 'firstName lastName email userID')
      .populate('squads.squadID', 'squadName members');

    return res.status(201).json(populatedMeal);
  } catch (error) {
    console.error('Error creating meal:', error);
    return res.status(400).json({ error: error.message });
  }
};

const getAllMeals = async (req, res) => {
  try {
    // Get authenticated user ID
    const authenticatedUserId = req.verifiedAuthId;
    console.log('Fetching meals for user:', authenticatedUserId);

    // Find user in MongoDB
    const user = await User.findOne({ userID: authenticatedUserId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all squads where the user is a member
    const userSquads = await Squad.find({ members: authenticatedUserId });
    const userSquadIds = userSquads.map((squad) => squad._id);

    // Find meals where:
    // 1. User is host, OR
    // 2. User is a direct participant, OR
    // 3. User is in a squad that's invited to the meal
    const meals = await Meal.find({
      $or: [
        { host: user._id },
        { 'participants.userID': user._id },
        { 'squads.squadID': { $in: userSquadIds } },
      ],
    })
      .populate('host', 'firstName lastName email userID')
      .populate('participants.userID', 'firstName lastName email userID')
      .populate('squads.squadID', 'squadName members');

    console.log(`Retrieved ${meals.length} meals from database`);
    return res.json(meals);
  } catch (error) {
    console.error('Error fetching all meals:', error);
    return res.status(500).json({ error: error.message });
  }
};

const getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.mealID)
      .populate('host', 'firstName lastName email userID')
      .populate('participants.userID', 'firstName lastName email userID')
      .populate('squads.squadID', 'squadName members');

    if (!meal) return res.status(404).json({ error: 'Meal not found' });
    return res.json(meal);
  } catch (error) {
    console.error('Error fetching meal by ID:', error);
    return res.status(500).json({ error: error.message });
  }
};

const updateMeal = async (req, res) => {
  try {
    console.log('Updating meal with ID:', req.params.mealID);
    console.log('Update data:', JSON.stringify(req.body, null, 2));

    // Find the meal first to check if it exists
    const meal = await Meal.findById(req.params.mealID);
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Handle participant status updates
    if (req.body.participants) {
      // For participant status updates, use findOneAndUpdate to directly update the participant's status
      const updatedParticipants = req.body.participants;

      // Update each participant individually
      for (const participant of updatedParticipants) {
        await Meal.updateOne(
          {
            _id: req.params.mealID,
            'participants._id': participant._id,
          },
          {
            $set: {
              'participants.$.status': participant.status,
            },
          },
        );
      }

      // Get the updated meal
      const updatedMeal = await Meal.findById(req.params.mealID)
        .populate('host', 'firstName lastName email userID')
        .populate('participants.userID', 'firstName lastName email userID')
        .populate('squads.squadID', 'squadName members');

      return res.json(updatedMeal);
    }

    // Handle squad status updates
    if (req.body.squads) {
      const updatedSquads = req.body.squads;

      // Update each squad individually
      for (const squad of updatedSquads) {
        await Meal.updateOne(
          {
            _id: req.params.mealID,
            'squads._id': squad._id,
          },
          {
            $set: {
              'squads.$.status': squad.status,
            },
          },
        );
      }

      // Get the updated meal
      const updatedMeal = await Meal.findById(req.params.mealID)
        .populate('host', 'firstName lastName email userID')
        .populate('participants.userID', 'firstName lastName email userID')
        .populate('squads.squadID', 'squadName members');

      return res.json(updatedMeal);
    }

    // For other updates, use the normal update method
    const updatedMeal = await Meal.findByIdAndUpdate(
      req.params.mealID,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate('host', 'firstName lastName email userID')
      .populate('participants.userID', 'firstName lastName email userID')
      .populate('squads.squadID', 'squadName members');

    return res.json(updatedMeal);
  } catch (error) {
    console.error('Error updating meal:', error);
    return res.status(400).json({ error: error.message });
  }
};

const deleteMeal = async (req, res) => {
  try {
    // Find the meal first to get the host ID
    const meal = await Meal.findById(req.params.mealID);
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Remove meal from host's mealsScheduled array
    if (meal.host) {
      await User.findByIdAndUpdate(meal.host, {
        $pull: { mealsScheduled: meal._id },
      });
    }

    // Delete the meal
    await Meal.findByIdAndDelete(req.params.mealID);

    return res.json({
      message: 'Meal deleted successfully',
      deletedMealId: req.params.mealID,
    });
  } catch (error) {
    console.error('Error deleting meal:', error);
    return res.status(500).json({ error: error.message });
  }
};

// New function to respond to a meal invitation on behalf of a squad
const respondToSquadInvitation = async (req, res) => {
  try {
    const { mealID, squadID, status } = req.body;

    if (!mealID || !squadID || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'mealID, squadID and status are required',
      });
    }

    if (!['confirmed', 'declined'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be either "confirmed" or "declined"',
      });
    }

    // Get authenticated user ID
    const authenticatedUserId = req.verifiedAuthId;

    // Check if user is a member of the squad
    const squad = await Squad.findById(squadID);
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    if (!squad.members.includes(authenticatedUserId)) {
      return res.status(403).json({
        error: 'Not authorized',
        message: 'You must be a member of the squad to respond to invitations',
      });
    }

    // Update the squad status in the meal
    const updatedMeal = await Meal.findOneAndUpdate(
      {
        _id: mealID,
        'squads.squadID': squadID,
      },
      {
        $set: {
          'squads.$.status': status,
        },
      },
      {
        new: true,
      },
    )
      .populate('host', 'firstName lastName email userID')
      .populate('participants.userID', 'firstName lastName email userID')
      .populate('squads.squadID', 'squadName members');

    if (!updatedMeal) {
      return res.status(404).json({
        error: 'Meal or squad invitation not found',
      });
    }

    // If confirmed, also update the status of all squad members
    if (status === 'confirmed') {
      // Get all squad members
      const memberUserIds = [];
      for (const memberId of squad.members) {
        const member = await User.findOne({ userID: memberId });
        if (member) {
          memberUserIds.push(member._id);
        }
      }

      // Update the status of all squad members in the meal
      await Meal.updateMany(
        {
          _id: mealID,
          'participants.userID': { $in: memberUserIds },
        },
        {
          $set: {
            'participants.$[elem].status': 'confirmed',
          },
        },
        {
          arrayFilters: [{ 'elem.userID': { $in: memberUserIds } }],
        },
      );

      // Get the final updated meal
      const finalMeal = await Meal.findById(mealID)
        .populate('host', 'firstName lastName email userID')
        .populate('participants.userID', 'firstName lastName email userID')
        .populate('squads.squadID', 'squadName members');

      return res.json(finalMeal);
    }

    return res.json(updatedMeal);
  } catch (error) {
    console.error('Error responding to squad invitation:', error);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  createMeal,
  getAllMeals,
  getMealById,
  updateMeal,
  deleteMeal,
  respondToSquadInvitation,
};
