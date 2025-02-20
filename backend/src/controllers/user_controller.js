import User from '../models/user_model';

export const createUser = async (firebaseUID, email, firstName, lastName) => {
  const newUser = new User({
    authID: firebaseUID,
    email,
    firstName,
    lastName,
  });

  try {
    const savedUser = await newUser.save();
    return savedUser;
  } catch (err) {
    throw new Error(`create user error: ${err}`);
  }
};

export const fetchUserFromAuth = async (firebaseUID) => {
  try {
    const fetchedUser = await User.findOne({ firebaseUID });
    return fetchedUser;
  } catch (err) {
    throw new Error(`fetch full user error ${err}`);
  }
};

export const updateUser = async (id, updatedFields) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });
    return updatedUser;
  } catch (err) {
    throw new Error(`update user error: ${err}`);
  }
};
