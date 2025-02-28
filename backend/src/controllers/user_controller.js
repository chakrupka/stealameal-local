// src/controllers/user_controller.js
import User from '../models/user_model';
import { admin } from '../middleware/require-auth'; // Import the shared admin instance

// Create new user
const handleCreateUser = async (req, res) => {
  try {
    const { email, firstName, lastName, profilePic, password } = req.body;

    // Step 1: Check if email already exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }

    // Step 2: Create a new user in Firebase Authentication
    const firebaseUser = await admin.auth().createUser({
      email,
      displayName: `${firstName} ${lastName}`,
      password,
    });

    // Step 3: Create a new user in MongoDB with the Firebase UID as userID
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

    // Step 4: Error Handling for Firebase Errors
    if (error?.errorInfo?.code === 'auth/email-already-exists') {
      // This error will now be rare, but we still handle it
      return res
        .status(400)
        .json({ error: 'Email already registered in Firebase.' });
    }

    return res.status(500).json({ error: error.message });
  }
};

// Get the authenticated user's details
const handleGetOwnedUser = async (req, res) => {
  try {
    // We read the Firebase UID from requireAuth
    const firebaseUID = req.verifiedAuthId;

    // Find user in MongoDB by userID (the stored Firebase UID)
    const user = await User.findOne({ userID: firebaseUID }).populate(
      'mealsScheduled',
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all users
const handleGetUsers = async (req, res) => {
  try {
    const users = await User.find().populate('mealsScheduled');
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get user by ID
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

// Update a user by ID
const handleUpdate = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userID,
      req.body,
      { new: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(updatedUser);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Delete a user by ID
const handleDelete = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.userID);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ================================
// Friend Request Functionality
// ================================
const sendFriendRequest = async (req, res) => {
  try {
    const { senderID, senderName, senderEmail, receiverID } = req.body;

    console.log('Backend: Received friend request params:', {
      senderID,
      senderName,
      senderEmail,
      receiverID,
    });

    // Validate input parameters
    if (!senderID || !receiverID) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both senderID and receiverID are required',
      });
    }

    // Check if sender and receiver are the same user
    if (senderID === receiverID) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'You cannot send a friend request to yourself',
      });
    }

    // First check if both IDs are valid Firebase UID format
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

    // 1. Find the receiver user by Firebase UID (userID field)
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

    // 3. Check if a friend request already exists
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

    // 4. Check if they're already friends
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

    // 5. Add the friend request object to the receiver
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
    const user = await User.findOne({ userID: firebaseUID }); 
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    console.error('Error fetching user by Firebase UID:', error);
    return res.status(500).json({ error: error.message });
  }
};
const acceptFriendRequest = async (req, res) => {
  try {
    const { receiverID, senderID } = req.body;

    // Get the receiver and sender users
    const receiver = await User.findOne({ userID: receiverID });
    const sender = await User.findOne({ userID: senderID });

    if (!receiver || !sender) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request exists
    const requestIndex = receiver.friendRequests.findIndex(
      (request) => request.senderID === senderID,
    );

    if (requestIndex === -1) {
      return res.status(400).json({ error: 'No friend request found' });
    }

    // Accept the request - remove from friendRequests
    receiver.friendRequests.splice(requestIndex, 1);

    // Add to friendsList
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

    // Check if request exists
    const requestIndex = receiver.friendRequests.findIndex(
      (request) => request.senderID === senderID,
    );

    if (requestIndex === -1) {
      return res.status(400).json({ error: 'No friend request found' });
    }

    // Decline the request - remove from friendRequests
    receiver.friendRequests.splice(requestIndex, 1);
    await receiver.save();

    return res.status(200).json({ message: 'Friend request declined' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
// Controller function for GET /users/:userID/friend-requests
const getFriendRequests = async (req, res) => {
  try {
    const { userID } = req.params;
    console.log('Getting friend requests for userID:', userID);

    // First check if this is a valid Firebase UID format
    // Firebase UIDs typically have a consistent format, around 28 characters
    if (!userID || typeof userID !== 'string' || userID.length < 20) {
      console.warn('Suspicious userID format (might be MongoDB _id?):', userID);
    }

    // Get all users for debugging
    const allUsers = await User.find({}, { userID: 1, email: 1 });
    console.log('Available users in database:');

    allUsers.forEach((u) => {
      console.log(`- Email: ${u.email}, userID: ${u.userID}, _id: ${u._id}`);
    });

    // Try to find the user
    const user = await User.findOne({ userID });

    if (!user) {
      console.error(`User not found with userID: ${userID}`);

      // Check if the provided ID might be a MongoDB _id
      if (userID.length === 24) {
        try {
          const userByMongoId = await User.findById(userID);
          if (userByMongoId) {
            console.error(
              `Found user by MongoDB _id instead of Firebase UID. This is incorrect usage.`,
            );
            // Don't automatically return this user - just log for debugging
          }
        } catch (e) {
          // Invalid ObjectId format - ignore
        }
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

    // Return the friendRequests array from the user document
    return res.status(200).json(user.friendRequests);
  } catch (error) {
    console.error('Error in getFriendRequests:', error);
    return res.status(500).json({ error: error.message });
  }
};
const searchByEmail = async (req, res) => {
  try {
    // Grab the 'email' from the query string: /users/search?email=...
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Missing email query parameter' });
    }

    // Case-insensitive match on the email substring
    const users = await User.find(
      { email: { $regex: new RegExp(email, 'i') } },
      // Only return the fields needed by AddFriendsScreen
      { firstName: 1, lastName: 1, email: 1, userID: 1 },
    );

    // Format results for the frontend
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
};
