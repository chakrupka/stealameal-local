import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    userID: { type: String, required: true, unique: true }, // Firebase UID as userID
    authID: { type: String, required: false, unique: false },
    profilePic: { type: String },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    location: { type: String },
    friendsList: [
      {
        friendID: String, // Ensure this is a String
        locationAvailable: { type: Boolean, default: false },
      },
    ],
    friendRequests: [
      {
        senderID: String, // Ensure this is a String
        senderName: String,
        senderEmail: String,
      },
    ],
    timesAvailable: {
      type: [Date],
      default: [],
    },
    mealsScheduled: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Meal',
      default: [],
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.authId;
    return ret;
  },
});

const User = mongoose.model('User', UserSchema);
export default User;
