import mongoose from 'mongoose';

const ScheduleItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['classes', 'sporting', 'extracurricular', 'other'],
    required: true,
  },
  timeBlock: {
    type: String,
  },
  schedule: {
    type: String,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  days: [{
    type: String,
    enum: ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'],
  }],
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  occurrenceType: {
    type: String,
    enum: ['weekly', 'specific'],
    default: 'weekly',
  },
  specificDate: {
    type: Date,
  },
}, {
  _id: true,
  timestamps: true,
});

const UserSchema = new mongoose.Schema(
  {
    userID: { type: String, required: true, unique: true },
    authID: { type: String, required: false, unique: false },
    profilePic: { type: String },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    location: { type: String },
    locationUpdatedAt: { type: Date },
    friendsList: [
      {
        friendID: String,
        locationAvailable: { type: Boolean, default: false },
      },
    ],
    friendRequests: [
      {
        senderID: String,
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
    availability: {
      classes: {
        type: [ScheduleItemSchema],
        default: [],
      },
      sporting: {
        type: [ScheduleItemSchema],
        default: [],
      },
      extracurricular: {
        type: [ScheduleItemSchema],
        default: [],
      },
      other: {
        type: [ScheduleItemSchema],
        default: [],
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
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
    delete ret.authId;
    return ret;
  },
});

UserSchema.methods.isAvailableAt = function(date, startTime, endTime) {
  if (!this.availability) return true;
  
  const checkDate = new Date(date);
  const dayOfWeek = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'][checkDate.getDay()];
  
  const allScheduleItems = [
    ...this.availability.classes,
    ...this.availability.sporting,
    ...this.availability.extracurricular,
    ...this.availability.other,
  ];
  
  for (const item of allScheduleItems) {
    if (this.isItemActiveOn(item, checkDate, dayOfWeek)) {
      if (this.timesOverlap(item.startTime, item.endTime, startTime, endTime)) {
        return false;
      }
    }
  }
  
  return true;
};

UserSchema.methods.isItemActiveOn = function(item, checkDate, dayOfWeek) {
  if (item.occurrenceType === 'specific') {
    if (!item.specificDate) return false;
    const specificDate = new Date(item.specificDate);
    return (
      specificDate.getFullYear() === checkDate.getFullYear() &&
      specificDate.getMonth() === checkDate.getMonth() &&
      specificDate.getDate() === checkDate.getDate()
    );
  }
  
  if (!item.days || !item.days.includes(dayOfWeek)) return false;
  
  if (item.startDate && checkDate < new Date(item.startDate)) return false;
  if (item.endDate && checkDate > new Date(item.endDate)) return false;
  
  return true;
};

UserSchema.methods.timesOverlap = function(start1, end1, start2, end2) {
  if (!start1 || !end1 || !start2 || !end2) return false;
  
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return s1 < e2 && s2 < e1;
};

const User = mongoose.model('User', UserSchema);
export default User;