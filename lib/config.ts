export const config = {
  orgName: process.env.ORG_NAME || "Bad Moms Christmas",
  dropoffLocation: process.env.DROPOFF_LOCATION || "Legend Realty, South Parkway",
  dropoffDate: process.env.DROPOFF_DATE || "December 20",
  dropoffWindow: process.env.DROPOFF_WINDOW || "9:00 AM - 11:00 AM",
  pickupWindow: process.env.PICKUP_WINDOW || "1:00 PM - 4:00 PM",
  submissionDeadline: process.env.SUBMISSION_DEADLINE || "October 31",
  claimLockMinutes: 30,
};
