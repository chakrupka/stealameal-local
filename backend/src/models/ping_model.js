import mongoose from 'mongoose';

const PingSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      default: "Let's grab a meal!",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },

    recipients: [
      {
        type: String,
        required: true,
      },
    ],

    squads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Squad',
      },
    ],

    responses: [
      {
        recipientId: {
          type: String,
          required: true,
        },
        response: {
          type: String,
          enum: ['accept', 'decline', 'dismiss'],
          required: true,
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

PingSchema.virtual('isActive').get(function () {
  return this.status === 'active' && new Date() < this.expiresAt;
});

PingSchema.index({ recipients: 1 });
PingSchema.index({ squads: 1 });
PingSchema.index({ sender: 1 });
PingSchema.index({ expiresAt: 1 });
PingSchema.index({ status: 1 });

export default mongoose.model('Ping', PingSchema);
