import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
  mealName: {
    type: String,
    required: true,
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [
    {
      userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['invited', 'confirmed', 'declined'],
        default: 'invited'
      }
    }
  ],
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true,
    enum: [
      '07:30', '07:45', '08:00', '08:15', '08:30', '08:45', 
      '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', 
      '10:30', '10:45', '11:00', '11:15', '11:30', '11:45', 
      '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', 
      '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', 
      '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', 
      '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', 
      '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', 
      '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', 
      '21:00', '21:15', '21:30', '21:45', '22:00'
    ]
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// not sure if we need this. Just trying to prevent scheduling conflict meals.
mealSchema.pre('save', async function (next) {
  const conflictingMeal = await mongoose.model('Meal').findOne({
    date: this.date,
    participants: {
      $elemMatch: {
        userID: { $in: this.participants.map(p => p.userID) }
      }
    },
    mealType: this.mealType
  });

  if (conflictingMeal) {
    const error = new Error('Conflicting meal schedule within the same block.');
    error.statusCode = 400;
    return next(error);
  }

  next();
});

export default mongoose.model('Meal', mealSchema);
