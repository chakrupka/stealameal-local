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
    locationUpdatedAt: { type: Date },
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
    // Delete sensitive fields
    delete ret.authId;
    
    // Ensure locationUpdatedAt is properly formatted as ISO string if it exists
    if (ret.locationUpdatedAt) {
      try {
        // Convert to ISO string for consistent JSON serialization
        const date = new Date(ret.locationUpdatedAt);
        if (!isNaN(date.getTime())) {
          ret.locationUpdatedAt = date.toISOString();
          console.log('TIMESTAMP DEBUG - Schema transform - Formatted locationUpdatedAt:', ret.locationUpdatedAt);
        } else {
          console.error('TIMESTAMP DEBUG - Schema transform - Invalid date:', ret.locationUpdatedAt);
          delete ret.locationUpdatedAt;
        }
      } catch (err) {
        console.error('TIMESTAMP DEBUG - Schema transform - Error formatting date:', err);
        delete ret.locationUpdatedAt;
      }
    }
    
    return ret;
  },
});

const User = mongoose.model('User', UserSchema);
export default User;
