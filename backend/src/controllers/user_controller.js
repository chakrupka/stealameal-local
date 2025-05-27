import User from '../models/user_model';
import { admin } from '../middleware/require-auth';

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
      userID: firebaseUser.uid,
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
    const updateData = { ...req.body };

    if (updateData.location) {
      updateData.locationUpdatedAt = new Date();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userID,
      updateData,
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

const handleDelete = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.userID);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const firebaseUID = req.verifiedAuthId;
    const { classes, sporting, extracurricular, other } = req.body;

    const user = await User.findOne({ userID: firebaseUID });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.availability = {
      classes: classes || [],
      sporting: sporting || [],
      extracurricular: extracurricular || [],
      other: other || [],
      lastUpdated: new Date(),
    };

    await user.save();

    return res.json({
      message: 'Availability updated successfully',
      availability: user.availability,
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    return res.status(500).json({ error: error.message });
  }
};

const getAvailability = async (req, res) => {
  try {
    const firebaseUID = req.verifiedAuthId;

    const user = await User.findOne({ userID: firebaseUID });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      availability: user.availability || {
        classes: [],
        sporting: [],
        extracurricular: [],
        other: [],
        lastUpdated: null,
      },
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return res.status(500).json({ error: error.message });
  }
};

const getFriendAvailability = async (req, res) => {
  try {
    const { friendUID } = req.params;
    const currentUserUID = req.verifiedAuthId;

    const currentUser = await User.findOne({ userID: currentUserUID });
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    const isFriend = currentUser.friendsList.some(
      (friend) => friend.friendID === friendUID,
    );

    if (!isFriend) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this user's availability" });
    }

    const friend = await User.findOne({ userID: friendUID });
    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    return res.json({
      availability: friend.availability || {
        classes: [],
        sporting: [],
        extracurricular: [],
        other: [],
        lastUpdated: null,
      },
      name: `${friend.firstName} ${friend.lastName}`,
    });
  } catch (error) {
    console.error('Error fetching friend availability:', error);
    return res.status(500).json({ error: error.message });
  }
};

const checkAvailability = async (req, res) => {
  try {
    const { userIDs, date, startTime, endTime } = req.body;

    if (!userIDs || !Array.isArray(userIDs) || userIDs.length === 0) {
      return res.status(400).json({ error: 'userIDs array is required' });
    }

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        error: 'date, startTime, and endTime are required',
      });
    }

    const users = await User.find({ userID: { $in: userIDs } });

    const availabilityResults = users.map((user) => {
      const isAvailable = user.isAvailableAt(date, startTime, endTime);
      return {
        userID: user.userID,
        name: `${user.firstName} ${user.lastName}`,
        isAvailable,
      };
    });

    return res.json({ results: availabilityResults });
  } catch (error) {
    console.error('Error checking availability:', error);
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
  updateAvailability,
  getAvailability,
  getFriendAvailability,
  checkAvailability,
};
