import mongoose from 'mongoose';

const MealSchema = new mongoose.Schema(
  {
    mealName: {
      type: String,
      required: true,
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Individual participants
    participants: [
      {
        userID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['invited', 'confirmed', 'declined'],
          default: 'invited',
        },
      },
    ],
    // Squad participants - reference to squads
    squads: [
      {
        squadID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Squad',
        },
        status: {
          type: String,
          enum: ['invited', 'confirmed', 'declined'],
          default: 'invited',
        },
      },
    ],
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      enum: [
        '07:30',
        '07:45',
        '08:00',
        '08:15',
        '08:30',
        '08:45',
        '09:00',
        '09:15',
        '09:30',
        '09:45',
        '10:00',
        '10:15',
        '10:30',
        '10:45',
        '11:00',
        '11:15',
        '11:30',
        '11:45',
        '12:00',
        '12:15',
        '12:30',
        '12:45',
        '13:00',
        '13:15',
        '13:30',
        '13:45',
        '14:00',
        '14:15',
        '14:30',
        '14:45',
        '15:00',
        '15:15',
        '15:30',
        '15:45',
        '16:00',
        '16:15',
        '16:30',
        '16:45',
        '17:00',
        '17:15',
        '17:30',
        '17:45',
        '18:00',
        '18:15',
        '18:30',
        '18:45',
        '19:00',
        '19:15',
        '19:30',
        '19:45',
        '20:00',
        '20:15',
        '20:30',
        '20:45',
        '21:00',
        '21:15',
        '21:30',
        '21:45',
        '22:00',
      ],
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

// Improved conflict detection logic
MealSchema.pre('save', async function (next) {
  try {
    // Skip conflict check for meal status updates when nothing critical changed
    if (
      !this.isNew &&
      !this.isModified('date') &&
      !this.isModified('time') &&
      !this.isModified('mealType')
    ) {
      console.log('Skipping conflict check for status update');
      return next();
    }

    console.log('Checking for conflicts...');

    // Get users who are confirming this meal (status = confirmed)
    const confirmedUserIds = this.participants
      .filter((p) => p.status === 'confirmed')
      .map((p) => p.userID);

    // If no confirmed participants, no need to check for conflicts
    if (confirmedUserIds.length === 0) {
      console.log('No confirmed participants, skipping conflict check');
      return next();
    }

    // Get date for query (midnight to 11:59 PM of the same day)
    const dateStart = new Date(this.date);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(this.date);
    dateEnd.setHours(23, 59, 59, 999);

    console.log(
      `Checking conflicts on ${dateStart.toISOString()} for meal type ${
        this.mealType
      }`,
    );
    console.log(`Current meal ID: ${this._id}`);

    // Find meals on the same day, with the same meal type,
    // where any of the confirmed participants are also confirmed in another meal
    const conflictingMeal = await mongoose.model('Meal').findOne({
      _id: { $ne: this._id }, // Exclude this meal from the check
      date: {
        $gte: dateStart,
        $lte: dateEnd,
      },
      mealType: this.mealType,
      participants: {
        $elemMatch: {
          userID: { $in: confirmedUserIds },
          status: 'confirmed',
        },
      },
    });

    if (conflictingMeal) {
      console.log(`Found conflicting meal: ${conflictingMeal._id}`);
      const error = new Error(
        'Conflicting meal schedule within the same block.',
      );
      error.statusCode = 400;
      return next(error);
    }

    console.log('No conflicts found');
    return next();
  } catch (error) {
    console.error('Error in conflict detection:', error);
    return next(error);
  }
});

export default mongoose.model('Meal', MealSchema);
