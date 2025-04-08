import User from '../models/user_model';
import { admin } from '../middleware/require-auth'; // Import the shared admin instance

const handleCreateUser = async (req, res) => {
  try {
    const { email, firstName, lastName, profilePic, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }

    const firebaseUser = await admin.auth().createUser({
      email,
      displayName: `${firstName} ${lastName}`,
      password,
    });

    const newUser = new User({
      userID: firebaseUser.uid, // Store the Firebase UID as userID
      email,
      firstName,
      lastName,
      profilePic,
    });

    await newUser.save();
    return res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);

    if (error?.errorInfo?.code === 'auth/email-already-exists') {
      return res
        .status(400)
        .json({ error: 'Email already registered in Firebase.' });
    }

    return res.status(500).json({ error: error.message });
  }
};

const handleGetOwnedUser = async (req, res) => {
  try {
    const firebaseUID = req.verifiedAuthId;

    const user = await User.findOne({ userID: firebaseUID }).populate(
      'mealsScheduled',
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const handleGetUsers = async (req, res) => {
  try {
    const users = await User.find().populate('mealsScheduled');
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const handleGetUserId = async (req, res) => {
  try {
    const user = await User.findById(req.params.userID).populate(
      'mealsScheduled',
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const handleUpdate = async (req, res) => {
  try {
    // Check if location is being updated
    const isLocationUpdate = req.body.location !== undefined;
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userID,
      req.body,
      { new: true },
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If this was a location update, update the locationAvailable status for all friends
    if (isLocationUpdate) {
      const locationIsShared = req.body.location && req.body.location !== 'ghost';
      
      // Find all users who have this user in their friends list
      const allUsersWithFriend = await User.find({
        'friendsList.friendID': updatedUser.userID
      });
      
      // Update each user's friend list to reflect the current location availability
      for (const user of allUsersWithFriend) {
        const friendIndex = user.friendsList.findIndex(
          friend => friend.friendID === updatedUser.userID
        );
        
        if (friendIndex !== -1) {
          user.friendsList[friendIndex].locationAvailable = locationIsShared;
          await user.save();
        }
      }
    }
    
    return res.json(updatedUser);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const handleDelete = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.userID);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { senderID, senderName, senderEmail, receiverID } = req.body;

    console.log('Backend: Received friend request params:', {
      senderID,
      senderName,
      senderEmail,
      receiverID,
    });

    if (!senderID || !receiverID) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both senderID and receiverID are required',
      });
    }

    if (senderID === receiverID) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'You cannot send a friend request to yourself',
      });
    }

    if (typeof senderID !== 'string' || senderID.length < 20) {
      console.warn(
        'Suspicious senderID format (might be MongoDB _id?):',
        senderID,
      );
    }

    if (typeof receiverID !== 'string' || receiverID.length < 20) {
      console.warn(
        'Suspicious receiverID format (might be MongoDB _id?):',
        receiverID,
      );
    }

    const receiver = await User.findOne({ userID: receiverID });

    if (!receiver) {
      console.error(`Backend: Receiver not found with userID: ${receiverID}`);
      return res.status(404).json({
        error: 'Receiver user not found',
        message: 'Make sure you are using the Firebase UID as receiverID',
      });
    }

    console.log('Backend: Receiver found:', receiver.email);

    // 2. Check if the sender exists
    const sender = await User.findOne({ userID: senderID });
    if (!sender) {
      console.error(`Backend: Sender not found with userID: ${senderID}`);
      return res.status(404).json({
        error: 'Sender user not found',
        message: 'Make sure you are using the Firebase UID as senderID',
      });
    }
    console.log('Backend: Sender found:', sender.email);

    const existingRequest = receiver.friendRequests.find(
      (request) => request.senderID === senderID,
    );

    if (existingRequest) {
      console.log('Friend request already exists');
      return res.status(400).json({
        error: 'Duplicate request',
        message: 'A friend request from this sender already exists',
      });
    }

    const alreadyFriends = receiver.friendsList.some(
      (friend) => friend.friendID === senderID,
    );

    if (alreadyFriends) {
      console.log('Users are already friends');
      return res.status(400).json({
        error: 'Already friends',
        message: 'These users are already friends',
      });
    }

    receiver.friendRequests.push({
      senderID,
      senderName: senderName || `${sender.firstName} ${sender.lastName}`,
      senderEmail: senderEmail || sender.email,
    });

    await receiver.save();

    console.log('Backend: Friend request saved successfully');
    return res.status(200).json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Backend: Error sending friend request:', error);
    return res.status(500).json({ error: error.message });
  }
};

const handleGetByFirebaseUid = async (req, res) => {
  try {
    const { firebaseUID } = req.params;
    console.log('Fetching user by Firebase UID:', firebaseUID);
    
    const user = await User.findOne({ userID: firebaseUID });
    
    if (!user) {
      console.error(`User not found with Firebase UID: ${firebaseUID}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User found:', user.email);
    console.log('TIMESTAMP DEBUG - User location data on fetch:', {
      location: user.location,
      locationUpdatedAt: user.locationUpdatedAt,
      locationUpdatedAt_toISOString: user.locationUpdatedAt ? user.locationUpdatedAt.toISOString() : null,
      locationUpdatedAt_type: user.locationUpdatedAt ? typeof user.locationUpdatedAt : 'null',
      locationUpdatedAt_constructor: user.locationUpdatedAt ? user.locationUpdatedAt.constructor.name : 'null'
    });
    
    // Create a response object with properly formatted locationUpdatedAt
    const userResponse = user.toJSON();
    
    // Additional check to ensure locationUpdatedAt is correctly formatted
    if (user.locationUpdatedAt) {
      userResponse.locationUpdatedAt = user.locationUpdatedAt.toISOString();
      console.log('TIMESTAMP DEBUG - Explicitly set locationUpdatedAt in response:', userResponse.locationUpdatedAt);
    } else if (user.updatedAt) {
      // Use updatedAt as fallback if no locationUpdatedAt
      userResponse.locationUpdatedAt = user.updatedAt.toISOString();
      console.log('TIMESTAMP DEBUG - Using updatedAt as fallback for locationUpdatedAt:', userResponse.locationUpdatedAt);
    }
    
    // Also ensure updatedAt is formatted
    if (user.updatedAt) {
      userResponse.updatedAt = user.updatedAt.toISOString();
    }
    
    return res.json(userResponse);
  } catch (error) {
    console.error('Error fetching user by Firebase UID:', error);
    return res.status(500).json({ error: error.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const { receiverID, senderID } = req.body;

    const receiver = await User.findOne({ userID: receiverID });
    const sender = await User.findOne({ userID: senderID });

    if (!receiver || !sender) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requestIndex = receiver.friendRequests.findIndex(
      (request) => request.senderID === senderID,
    );

    if (requestIndex === -1) {
      return res.status(400).json({ error: 'No friend request found' });
    }

    receiver.friendRequests.splice(requestIndex, 1);

    receiver.friendsList.push({ friendID: senderID, locationAvailable: false });
    sender.friendsList.push({ friendID: receiverID, locationAvailable: false });

    await receiver.save();
    await sender.save();

    return res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const declineFriendRequest = async (req, res) => {
  try {
    const { receiverID, senderID } = req.body;
    const receiver = await User.findOne({ userID: receiverID });

    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requestIndex = receiver.friendRequests.findIndex(
      (request) => request.senderID === senderID,
    );

    if (requestIndex === -1) {
      return res.status(400).json({ error: 'No friend request found' });
    }

    receiver.friendRequests.splice(requestIndex, 1);
    await receiver.save();

    return res.status(200).json({ message: 'Friend request declined' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const getFriendRequests = async (req, res) => {
  try {
    const { userID } = req.params;
    console.log('Getting friend requests for userID:', userID);

    if (!userID || typeof userID !== 'string' || userID.length < 20) {
      console.warn('Suspicious userID format (might be MongoDB _id?):', userID);
    }

    const allUsers = await User.find({}, { userID: 1, email: 1 });
    console.log('Available users in database:');

    allUsers.forEach((u) => {
      console.log(`- Email: ${u.email}, userID: ${u.userID}, _id: ${u._id}`);
    });

    const user = await User.findOne({ userID });

    if (!user) {
      console.error(`User not found with userID: ${userID}`);

      if (userID.length === 24) {
        try {
          const userByMongoId = await User.findById(userID);
          if (userByMongoId) {
            console.error(
              `Found user by MongoDB _id instead of Firebase UID. This is incorrect usage.`,
            );
          }
        } catch (e) {}
      }

      return res.status(404).json({
        error: 'User not found',
        message:
          'No user found with the provided userID. Make sure you are using the Firebase UID.',
        providedId: userID,
      });
    }

    console.log(`Found user with email: ${user.email}`);
    console.log('Friend requests count:', user.friendRequests.length);
    console.log('Friend requests:', JSON.stringify(user.friendRequests));

    return res.status(200).json(user.friendRequests);
  } catch (error) {
    console.error('Error in getFriendRequests:', error);
    return res.status(500).json({ error: error.message });
  }
};
const searchByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Missing email query parameter' });
    }

    const users = await User.find(
      { email: { $regex: new RegExp(email, 'i') } },
      { firstName: 1, lastName: 1, email: 1, userID: 1 },
    );

    const results = users.map((u) => ({
      userID: u.userID,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
    }));

    return res.json(results);
  } catch (error) {
    console.error('Error searching by email:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Add a specific controller for updating location
const updateLocation = async (req, res) => {
  try {
    const { userID } = req.params;
    const { location } = req.body;
    
    console.log(`Updating location for user ID: ${userID} to: ${location}`);
    
    if (location === undefined) {
      return res.status(400).json({ error: 'Location is required' });
    }
    
    // Get the current timestamp
    const now = new Date();
    console.log('Setting locationUpdatedAt to:', now.toISOString());
    
    // Update with the location and add timestamp
    const updateData = {
      location,
      locationUpdatedAt: now,
      // Force update of updatedAt as well (for consistency)
      updatedAt: now
    };
    
    // Find the user first to make sure we have the right one
    console.log('Looking up user by MongoDB ID:', userID);
    const user = await User.findById(userID);
    
    if (!user) {
      console.error(`User not found with MongoDB ID: ${userID}`);
      return res.status(404).json({ error: 'User not found with MongoDB ID' });
    }
    
    console.log(`Found user: ${user.email} (Firebase UID: ${user.userID})`);
    console.log('Current location data:', {
      location: user.location,
      locationUpdatedAt: user.locationUpdatedAt
    });
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userID,
      updateData,
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // After update, check that locationUpdatedAt was saved correctly
    console.log('TIMESTAMP DEBUG - Updated user location data:', {
      location: updatedUser.location,
      locationUpdatedAt: updatedUser.locationUpdatedAt,
      locationUpdatedAt_toISOString: updatedUser.locationUpdatedAt ? updatedUser.locationUpdatedAt.toISOString() : null,
      locationUpdatedAt_type: updatedUser.locationUpdatedAt ? typeof updatedUser.locationUpdatedAt : 'null'
    });
    
    // Location is shared if it's set and not 'ghost'
    const locationIsShared = location && location !== 'ghost';
    console.log(`Location is shared: ${locationIsShared}`);
    
    // Find all users who have this user in their friends list
    const allUsersWithFriend = await User.find({
      'friendsList.friendID': updatedUser.userID
    });
    
    console.log(`Found ${allUsersWithFriend.length} friends that need to be updated`);
    
    // Update each user's friend list to reflect the current location availability
    for (const user of allUsersWithFriend) {
      const friendIndex = user.friendsList.findIndex(
        friend => friend.friendID === updatedUser.userID
      );
      
      if (friendIndex !== -1) {
        console.log(`Updating friend availability for user: ${user.email}`);
        console.log(`Before update: locationAvailable = ${user.friendsList[friendIndex].locationAvailable}`);
        
        user.friendsList[friendIndex].locationAvailable = locationIsShared;
        await user.save();
        
        console.log(`After update: locationAvailable = ${user.friendsList[friendIndex].locationAvailable}`);
      }
    }
    
    // Create a clean response with absolutely explicit date formatting
    const userJson = updatedUser.toJSON();
    const response = {
      ...userJson
    };
    
    // Explicitly format the dates and add them to the response
    // First handle locationUpdatedAt
    if (updatedUser.locationUpdatedAt) {
      try {
        const dateStr = updatedUser.locationUpdatedAt.toISOString();
        response.locationUpdatedAt = dateStr;
        console.log('TIMESTAMP DEBUG - locationUpdatedAt explicit ISO string:', dateStr);
      } catch (err) {
        console.error('TIMESTAMP DEBUG - Error creating locationUpdatedAt ISO string:', err);
        response.locationUpdatedAt = null;
      }
    } else {
      console.warn('TIMESTAMP DEBUG - locationUpdatedAt is missing after update!');
      response.locationUpdatedAt = null;
    }
    
    // Also handle updatedAt for consistency
    if (updatedUser.updatedAt) {
      try {
        const updatedAtStr = updatedUser.updatedAt.toISOString();
        response.updatedAt = updatedAtStr;
        console.log('TIMESTAMP DEBUG - updatedAt explicit ISO string:', updatedAtStr);
        
        // If locationUpdatedAt is missing, use updatedAt as fallback
        if (!response.locationUpdatedAt) {
          response.locationUpdatedAt = updatedAtStr;
          console.log('TIMESTAMP DEBUG - Using updatedAt as fallback for locationUpdatedAt');
        }
      } catch (err) {
        console.error('TIMESTAMP DEBUG - Error creating updatedAt ISO string:', err);
      }
    }
    
    console.log('TIMESTAMP DEBUG - Final response object:', {
      location: response.location,
      locationUpdatedAt: response.locationUpdatedAt,
      locationUpdatedAtType: typeof response.locationUpdatedAt,
      hasLocationUpdatedAt: 'locationUpdatedAt' in response
    });
    
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Route to fix missing locationUpdatedAt for users who have locations
const fixMissingLocationTimestamps = async (req, res) => {
  try {
    console.log('TIMESTAMP DEBUG - Running fix for missing locationUpdatedAt timestamps');
    
    // First identify all users with locations
    const allUsers = await User.find({
      location: { $exists: true, $ne: null, $ne: 'No Location', $ne: 'ghost' }
    });
    
    console.log(`TIMESTAMP DEBUG - Found ${allUsers.length} users with locations`);
    
    let usersWithoutTimestamp = 0;
    let usersWithInvalidTimestamp = 0;
    let updatedCount = 0;
    const now = new Date();
    
    // Process all users
    for (const user of allUsers) {
      let needsUpdate = false;
      
      // Check if timestamp is missing
      if (!user.locationUpdatedAt) {
        console.log(`TIMESTAMP DEBUG - User ${user.email} has location but no timestamp`);
        usersWithoutTimestamp++;
        needsUpdate = true;
      } 
      // Check if timestamp is invalid
      else {
        try {
          const date = new Date(user.locationUpdatedAt);
          if (isNaN(date.getTime())) {
            console.log(`TIMESTAMP DEBUG - User ${user.email} has invalid timestamp: ${user.locationUpdatedAt}`);
            usersWithInvalidTimestamp++;
            needsUpdate = true;
          }
        } catch (err) {
          console.log(`TIMESTAMP DEBUG - User ${user.email} has timestamp that throws error: ${err.message}`);
          usersWithInvalidTimestamp++;
          needsUpdate = true;
        }
      }
      
      // Update if needed
      if (needsUpdate) {
        // Set both timestamp fields
        user.locationUpdatedAt = now;
        user.updatedAt = now;
        
        // Use the direct save method to ensure Mongoose doesn't override our updatedAt
        await User.updateOne(
          { _id: user._id }, 
          { 
            $set: { 
              locationUpdatedAt: now,
              updatedAt: now
            } 
          }
        );
        
        updatedCount++;
        console.log(`TIMESTAMP DEBUG - Fixed timestamps for ${user.email}:
          - locationUpdatedAt: ${now.toISOString()}
          - updatedAt: ${now.toISOString()}`);
      }
    }
    
    return res.json({ 
      message: `Fixed ${updatedCount} users with timestamp issues`,
      details: {
        totalUsersWithLocations: allUsers.length,
        usersWithoutTimestamp,
        usersWithInvalidTimestamp,
        usersFixed: updatedCount
      }
    });
  } catch (error) {
    console.error('Error fixing locationUpdatedAt:', error);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  handleCreateUser,
  handleGetOwnedUser,
  handleGetUsers,
  handleGetUserId,
  handleUpdate,
  handleDelete,
  sendFriendRequest,
  getFriendRequests,
  searchByEmail,
  acceptFriendRequest,
  handleGetByFirebaseUid,
  declineFriendRequest,
  updateLocation,
  fixMissingLocationTimestamps,
};
