import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  //userID: { type: String, required: true, unique: true }, I'm not sure we need this since Mongo assigns
  profilePic: { type: String },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  location: { type: String },
  friendList: [
    {
      friendID: String,
      locationAvailable: { type: Boolean, default: false }
    }
  ],
  timesAvailable: {
    type: [Date], 
    default: []
  },
  mealsScheduled: {
    type: [mongoose.Schema.Types.ObjectId], 
    ref: 'Meal',
    default: []
  }
});

const User = mongoose.model('User', userSchema);
export default User;
