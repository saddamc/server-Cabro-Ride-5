import { Document, Types } from 'mongoose';
import { IDriver } from '../driver/driver.interface';
import { IUser } from '../user/user.interface';



export interface IRide extends Document {
  _id: Types.ObjectId;
  rider: Types.ObjectId | IUser;
  driver?: Types.ObjectId | IDriver;
  pickupLocation: IRideLocation;
  destinationLocation: IRideLocation;
  status: RideStatus;
  fare: IFare;
  distance: IDistance;
  duration: IDuration;
  timestamps: IRideTimestamps;
  cancellation?: ICancellation;
  rating?: IRideRating;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  updateStatus(newStatus: RideStatus, updatedBy?: string): Promise<IRide>;
  cancel(cancelledBy: string, reason?: string): Promise<IRide>;
  calculateFare(): number;
}

export interface IRideLocation {
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export type RideStatus = 
  | 'requested'
  | 'accepted'
  | 'driver_arrived'
  | 'picked_up'
  | 'in_transit'
  | 'completed'
  | 'cancelled'
  | 'no_driver_found';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface IFare {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  totalFare: number;
  currency: string;
}

export interface IDistance {
  estimated: number;
  actual: number;
}

export interface IDuration {
  estimated: number;
  actual: number;
}

export interface IRideTimestamps {
  requested: Date;
  accepted?: Date;
  driverArrived?: Date;
  pickedUp?: Date;
  inTransit?: Date;
  completed?: Date;
  cancelled?: Date;
}

export interface ICancellation {
  cancelledBy: 'rider' | 'driver' | 'admin';
  reason?: string; // Work later for reason
  cancelledAt: Date;
}

export interface IRideRating {
  riderRating?: number;
  driverRating?: number;
  riderFeedback?: string;
  driverFeedback?: string;
}

export interface IRideRequest {
  pickupLocation: IRideLocation;
  destinationLocation: IRideLocation;
  notes?: string;
}

export interface IRideStatusUpdate {
  status: RideStatus;
}

export interface IRideCancel {
  reason?: string;
}

// ✅ update Ride Status
export const statusFlow: Record<RideStatus, RideStatus | null> = {
    requested: "accepted",
    accepted: "driver_arrived",
    driver_arrived: "picked_up",
    picked_up: "in_transit",
    in_transit: "completed",
    completed: null, // ✅ end
    cancelled: null, // 🚫 
    no_driver_found: null, // 🚫 
};