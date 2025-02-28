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

    // 1. Find both users
    const sender = await User.findOne({ userID: senderID });
    const receiver = await User.findOne({ userID: receiverID });
    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Add the friend request object to the receiver
    receiver.friendRequests.push({
      senderID,
      senderName,
      senderEmail,
    });
    await receiver.save();

    return res.status(200).json({ message: 'Friend request sent' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const { receiverID, senderID } = req.body;

    // Get the receiver and sender users
    const receiver = await User.findOne({ userID: receiverID }); // Use userID instead of _id
    const sender = await User.findOne({ userID: senderID }); // Use userID instead of _id

    if (!receiver || !sender) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request exists
    if (!receiver.friendRequests.includes(senderID)) {
      return res.status(400).json({ error: 'No friend request found' });
    }

    // Accept the request
    receiver.friendRequests = receiver.friendRequests.filter(
      (id) => id.toString() !== senderID,
    );
    receiver.friendsList.push(senderID);
    sender.friendsList.push(receiverID);

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
    const receiver = await User.findOne({ userID: receiverID }); // Use userID instead of _id

    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request exists
    if (!receiver.friendRequests.includes(senderID)) {
      return res.status(400).json({ error: 'No friend request found' });
    }

    // Decline the request
    receiver.friendRequests = receiver.friendRequests.filter(
      (id) => id.toString() !== senderID,
    );
    await receiver.save();

    return res.status(200).json({ message: 'Friend request declined' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const getFriendRequests = async (req, res) => {
  try {
    const { userID } = req.params;
    const user = await User.findOne({ userID });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Just return the array you stored:
    return res.status(200).json(user.friendRequests);
  } catch (error) {
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
  declineFriendRequest,
};
