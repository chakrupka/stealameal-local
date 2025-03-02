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
        // 24 hour now
        '00:00',
        '00:15',
        '00:30',
        '00:45',
        '01:00',
        '01:15',
        '01:30',
        '01:45',
        '02:00',
        '02:15',
        '02:30',
        '02:45',
        '03:00',
        '03:15',
        '03:30',
        '03:45',
        '04:00',
        '04:15',
        '04:30',
        '04:45',
        '05:00',
        '05:15',
        '05:30',
        '05:45',
        '06:00',
        '06:15',
        '06:30',
        '06:45',
        '07:00',
        '07:15',
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
        '22:15',
        '22:30',
        '22:45',
        '23:00',
        '23:15',
        '23:30',
        '23:45',
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

MealSchema.pre('save', async function (next) {
  try {
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

    const confirmedUserIds = this.participants
      .filter((p) => p.status === 'confirmed')
      .map((p) => p.userID);

    if (confirmedUserIds.length === 0) {
      console.log('No confirmed participants, skipping conflict check');
      return next();
    }

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
