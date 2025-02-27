import User from '../models/user_model';

// Create new user
const handleCreateUser = async (req, res) => {
  try {
    const newUser = new User({ ...req.body, authID: req.verifiedAuthId });
    await newUser.save();
    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(400).json({ error: error.message });
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

// Get user associated with Firebase account upon login / sign up
const handleGetOwnedUser = async (req, res) => {
  try {
    const user = await User.findOne(req.verifiedAuthId).populate(
      'mealsScheduled',
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get user by ID
const handleGetUserId = async (req, res) => {
  try {
    const user = await User.findOne(req.params.userID).populate(
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

// Delete user using their ID
const handleDelete = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.userID);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
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
};
