import mongoose from 'mongoose';

const SquadSchema = new mongoose.Schema(
  {
    squadName: {
      type: String,
      required: true,
      trim: true,
    },
    // Store Firebase UIDs as strings
    members: [
      {
        type: String,
        required: true,
      },
    ],
    createdBy: {
      type: String, // Firebase UID of the user who created the squad
      required: true,
    },
    // Optional fields
    description: {
      type: String,
      default: '',
    },
    squadImage: {
      type: String, // URL to the squad image
      default: null,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

// Make sure we're not using the old reference to User model
// Instead, we store Firebase UIDs directly

// Add index for faster lookups
SquadSchema.index({ members: 1 });
SquadSchema.index({ createdBy: 1 });

export default mongoose.model('Squad', SquadSchema);
