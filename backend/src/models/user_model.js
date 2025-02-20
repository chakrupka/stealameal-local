const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  profilePic: { type: String },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  location: {
    type: {
      latitude: Number,
      longitude: Number
    },
    required: false
  },
  friendList: [
    {
      friendID: String,
      locationAvailable: { type: Boolean, default: false }
    }
  ],
  timesAvailable: {
    type: Map,
    of: [Boolean],
    default: () => {
      const defaultAvailability = Array(58).fill(true);
      return {
        "Monday": defaultAvailability,
        "Tuesday": defaultAvailability,
        "Wednesday": defaultAvailability,
        "Thursday": defaultAvailability,
        "Friday": defaultAvailability,
        "Saturday": defaultAvailability,
        "Sunday": defaultAvailability
      };
    }
  },
  mealsScheduled: {
    type: Map,
    of: [Number],
    default: () => ({
      "Monday": [],
      "Tuesday": [],
      "Wednesday": [],
      "Thursday": [],
      "Friday": [],
      "Saturday": [],
      "Sunday": []
    })
  }
});

module.exports = mongoose.model('User', userSchema);
