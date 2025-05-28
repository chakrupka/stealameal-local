import mongoose from 'mongoose';

const ScheduleItemSchema = new mongoose.Schema(
  {
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
    days: [
      {
        type: String,
        enum: ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'],
      },
    ],
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
  },
  {
    _id: true,
    timestamps: true,
  },
);

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

// Replace the isAvailableAt method in your user_model.js with this fixed version:

UserSchema.methods.isAvailableAt = function (date, startTime, endTime) {
  if (!this.availability) {
    console.log(
      `${this.firstName} ${this.lastName}: No availability data - AVAILABLE`,
    );
    return true;
  }

  if (
    !this.availability.classes &&
    !this.availability.sporting &&
    !this.availability.extracurricular &&
    !this.availability.other
  ) {
    console.log(
      `${this.firstName} ${this.lastName}: No schedule categories - AVAILABLE`,
    );
    return true;
  }

  const checkDate = new Date(date);
  const dayOfWeek = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'][checkDate.getDay()];

  console.log(
    `\n=== BACKEND AVAILABILITY CHECK - ${this.firstName} ${this.lastName} ===`,
  );
  console.log(`Check Date: ${checkDate.toISOString()} (${dayOfWeek})`);
  console.log(`Check Time: ${startTime} to ${endTime}`);

  const allScheduleItems = [
    ...(Array.isArray(this.availability.classes)
      ? this.availability.classes
      : []),
    ...(Array.isArray(this.availability.sporting)
      ? this.availability.sporting
      : []),
    ...(Array.isArray(this.availability.extracurricular)
      ? this.availability.extracurricular
      : []),
    ...(Array.isArray(this.availability.other) ? this.availability.other : []),
  ];

  if (allScheduleItems.length === 0) {
    console.log(`No schedule items found - AVAILABLE`);
    return true;
  }

  const checkStartTime = new Date(startTime);
  const checkEndTime = new Date(endTime);

  console.log(`Found ${allScheduleItems.length} schedule items to check:`);

  for (const item of allScheduleItems) {
    console.log(`\n  Checking: ${item.name} (${item.category})`);
    console.log(`    Days: ${JSON.stringify(item.days)}`);
    console.log(`    Original Start: ${item.startTime}`);
    console.log(`    Original End: ${item.endTime}`);
    console.log(`    Occurrence Type: ${item.occurrenceType || 'weekly'}`);

    if (this.isItemActiveOn(item, checkDate, dayOfWeek)) {
      console.log(`    ✓ Item is active on ${dayOfWeek}`);

      // *** THIS IS THE KEY FIX ***
      // For recurring weekly activities, we need to compare time only, not full datetime
      if (item.occurrenceType === 'specific' && item.specificDate) {
        // For specific date activities, use the original logic
        console.log(`    Using specific date logic`);
        if (
          this.timesOverlapPrecise(
            item.startTime,
            item.endTime,
            checkStartTime,
            checkEndTime,
          )
        ) {
          console.log(`    ❌ CONFLICT FOUND! User is BUSY (specific date)`);
          return false;
        }
      } else {
        // For recurring weekly activities, extract just the time
        const activityStart = new Date(item.startTime);
        const activityEnd = new Date(item.endTime);

        // Create new dates for the check day with the activity's time
        const activityStartOnCheckDay = new Date(checkDate);
        activityStartOnCheckDay.setHours(
          activityStart.getHours(),
          activityStart.getMinutes(),
          activityStart.getSeconds(),
          activityStart.getMilliseconds(),
        );

        const activityEndOnCheckDay = new Date(checkDate);
        activityEndOnCheckDay.setHours(
          activityEnd.getHours(),
          activityEnd.getMinutes(),
          activityEnd.getSeconds(),
          activityEnd.getMilliseconds(),
        );

        // Handle activities that span midnight (like the 11-hour flute practice)
        if (
          activityEnd.getHours() < activityStart.getHours() ||
          (activityEnd.getHours() === activityStart.getHours() &&
            activityEnd.getMinutes() < activityStart.getMinutes())
        ) {
          activityEndOnCheckDay.setDate(activityEndOnCheckDay.getDate() + 1);
          console.log(`    Activity spans midnight - adjusted end time`);
        }

        console.log(
          `    Comparing activity time: ${activityStartOnCheckDay.toISOString()} to ${activityEndOnCheckDay.toISOString()}`,
        );
        console.log(
          `    Against check time: ${checkStartTime.toISOString()} to ${checkEndTime.toISOString()}`,
        );

        if (
          this.timesOverlapPrecise(
            activityStartOnCheckDay,
            activityEndOnCheckDay,
            checkStartTime,
            checkEndTime,
          )
        ) {
          console.log(`    ❌ CONFLICT FOUND! User is BUSY (weekly recurring)`);
          return false;
        } else {
          console.log(`    ✅ No conflict with this item`);
        }
      }
    } else {
      console.log(`    ⏭ Item is NOT active on ${dayOfWeek}`);
    }
  }

  console.log(
    `No conflicts found - ${this.firstName} ${this.lastName} is AVAILABLE`,
  );
  console.log(`=== END AVAILABILITY CHECK ===\n`);
  return true;
};
UserSchema.methods.timesOverlapPrecise = function (
  activityStart,
  activityEnd,
  checkStart,
  checkEnd,
) {
  if (!activityStart || !activityEnd || !checkStart || !checkEnd) return false;

  const actStart = new Date(activityStart);
  const actEnd = new Date(activityEnd);
  const chkStart = new Date(checkStart);
  const chkEnd = new Date(checkEnd);

  return actStart < chkEnd && actEnd > chkStart;
};
UserSchema.methods.isItemActiveOn = function (item, checkDate, dayOfWeek) {
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

UserSchema.methods.timesOverlap = function (start1, end1, start2, end2) {
  if (!start1 || !end1 || !start2 || !end2) return false;

  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);

  return s1 < e2 && s2 < e1;
};

const User = mongoose.model('User', UserSchema);
export default User;
