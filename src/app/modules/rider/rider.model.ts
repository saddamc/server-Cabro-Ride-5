import { Schema, model } from 'mongoose';
import { calculateDistance } from '../../utils/calculateDistance';
import { IRide, RIDE_STATUS } from './rider.interface';

const rideSchema = new Schema<IRide>(
  {
    rider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: Schema.Types.ObjectId, ref: 'Driver', default: null },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    pickupLocation: {
      address: { type: String, required: true },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    destinationLocation: {
      address: { type: String, required: true },
      coordinates: { type: [Number], required: true },
    },
    status: {
      type: String,
      enum: [
        'requested',
        'accepted',
        'driver_arrived',
        'picked_up',
        'in_transit',
        'payment_pending',
        'payment_completed',
        'completed',
        'cancelled',
        'no_driver_found',
        'failed'
      ],
      default: 'requested',
    },
    fare: {
      baseFare: { type: Number, default: 0 },
      distanceFare: { type: Number, default: 0 },
      timeFare: { type: Number, default: 0 },
      totalFare: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
    },
    distance: {
      estimated: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
    },
    duration: {
      estimated: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
    },
    timestamps: {
      requested: { type: Date, default: Date.now },
      accepted: Date,
      driverArrived: Date,
      pickedUp: Date,
      inTransit: Date,
      completed: Date,
      cancelled: Date,
    },
    cancellation: {
      cancelledBy: { type: String, enum: ['rider', 'driver', 'admin'] },
      reason: String,
      cancelledAt: Date,
    },
    rating: {
      riderRating: {type: Number },
      driverRating: Number,
      riderFeedback: String,
      driverFeedback: String,
    },
    paymentStatus: {
        type: String,
        enum: Object.values(RIDE_STATUS),
    },
    paymentMethod: { 
        type: String,
        enum: ['cash', 'card', 'mobile_banking', 'online'], 
        default: 'cash'
    },
    pin: { type: String, default: null },
    notes: String,
  },
  { timestamps: true }
);

// Methods
rideSchema.methods.calculateFare = function (): number {
  const baseFare = 150; // Flat booking fee
  const perKmRate = 50; // Fare per km
  const perMinuteRate = 2; // Fare per minute

  // 🔹 Calculate distance between pickup and destination
  const distanceKm = calculateDistance(
    this.pickupLocation.coordinates,
    this.destinationLocation.coordinates
  );

  // Save estimated or actual distance
  if (!this.distance.estimated) {
    this.distance.estimated = distanceKm;
  }
  this.distance.actual = distanceKm;

  // 🔹 Calculate time fare
  const timeMinutes = this.duration.actual || this.duration.estimated || 0;
  const distanceFare = distanceKm * perKmRate;
  const timeFare = timeMinutes * perMinuteRate;

  // 🔹 Total
  const totalFare = Math.round(baseFare + distanceFare + timeFare);

  this.fare = {
    baseFare,
    distanceFare,
    timeFare,
    totalFare,
    currency: "BDT",
  };

  return totalFare;
};


export const Ride = model<IRide>('Ride', rideSchema);
