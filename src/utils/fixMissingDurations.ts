import { Ride } from '../app/modules/rider/rider.model';

const fixMissingDurations = async () => {
  console.log('🔧 Fixing missing durations for completed rides...');

  try {
    // Find all completed rides without actual duration
    const ridesWithoutDuration = await Ride.find({
      status: 'completed',
      $or: [
        { 'duration.actual': { $exists: false } },
        { 'duration.actual': null },
        { 'duration.actual': 0 }
      ]
    });

    console.log(`Found ${ridesWithoutDuration.length} rides without duration`);

    let fixedCount = 0;

    for (const ride of ridesWithoutDuration) {
      // Calculate duration using pickedUp or accepted timestamp
      const startTime = ride.timestamps?.pickedUp || ride.timestamps?.accepted;
      const endTime = ride.timestamps?.completed;

      if (startTime && endTime) {
        const durationMinutes = Math.round(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60)
        );

        if (durationMinutes > 0) {
          ride.duration = {
            ...ride.duration,
            actual: durationMinutes
          };
          await ride.save();
          fixedCount++;
        }
      }
    }

    console.log(`✅ Fixed duration for ${fixedCount} rides`);
  } catch (error) {
    console.error('❌ Error fixing durations:', error);
  }
};

export default fixMissingDurations;