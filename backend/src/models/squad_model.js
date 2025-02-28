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
      type: String, 
      required: true,
    },
    // Optional fields
    description: {
      type: String,
      default: '',
    },
    squadImage: {
      type: String, 
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



SquadSchema.index({ members: 1 });
SquadSchema.index({ createdBy: 1 });

export default mongoose.model('Squad', SquadSchema);
