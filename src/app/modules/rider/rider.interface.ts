import { Document, Types } from 'mongoose';
import { IDriver } from '../driver/driver.interface';
import { IUser } from '../user/user.interface';


export enum RIDE_STATUS {
    PENDING = 'PENDING',
    CANCEL = 'CANCEL',
    COMPLETE = 'complete',
    FAILED = 'FAILED'
}

export interface IRide extends Document {
  _id: Types.ObjectId;
  rider: Types.ObjectId | IUser;
  driver?: Types.ObjectId | IDriver;
  payment?: Types.ObjectId;
  pickupLocation: IRideLocation;
  destinationLocation: IRideLocation;
  status: RideStatus;
  fare: IFare;
  distance: IDistance;
  duration: IDuration;
  timestamps: IRideTimestamps;
  cancellation?: ICancellation;
  rating?: IRideRating;
  paymentStatus?: RIDE_STATUS;
  paymentMethod?: string;
  transactionId?: string;
  pin?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  updateStatus(newStatus: RideStatus, updatedBy?: string): Promise<IRide>;
  cancel(cancelledBy: string, reason?: string): Promise<IRide>;
  calculateFare(): number;
}

export interface IRideLocation {
  address: string;
  coordinates: [number, number];
}

export type RideStatus =
  | 'requested'
  | 'accepted'
  // | 'driver_arrived'
  | 'picked_up'
  | 'in_transit'
  | 'payment_pending'
  | 'payment_completed'
  | 'completed'
  | 'cancelled'
  | 'no_driver_found'
  | 'failed'

// export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

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
  reason?: string;
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

export const statusFlow: Record<RideStatus, RideStatus | null> = {
  requested: 'accepted',
  accepted: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'payment_pending',
  payment_pending: 'payment_completed',
  payment_completed: 'completed',
  completed: null,
  cancelled: null,
  no_driver_found: null,
  failed: null, // ✅ added
};
