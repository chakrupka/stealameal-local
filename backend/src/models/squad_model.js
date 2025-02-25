import mongoose from 'mongoose';

const SquadSchema = new mongoose.Schema(
  {
    squadName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

export default mongoose.model('Squad', SquadSchema);
