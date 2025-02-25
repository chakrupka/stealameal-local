import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    authID: { type: String, required: true, unique: true },
    profilePic: { type: String },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    location: { type: String },
    friendList: [
      {
        friendID: String,
        locationAvailable: { type: Boolean, default: false },
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
