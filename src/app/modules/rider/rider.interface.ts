// import { Types } from "mongoose";
// import { ILocation } from "../driver/driver.interface";

// export enum RIDER_STATUS {
//     REQUESTED = "requested",
//     ACCEPTED = "accepted",
//     PICKED_UP = "picked_up",
//     IN_TRANSIT = "in_transit",
//     COMPLETED = "completed",
//     CANCELLED = "cancelled"
// }

// export interface IRideStatusHistory {
//     status: RIDER_STATUS;
//     timestamp: Date;
//     changeBy?: Types.ObjectId; // Ref: user, who changed: status
// }

// export interface IRide extends Document {
//     _id: Types.ObjectId;
//     riderId: Types.ObjectId; // Ref: IUser
//     driverId?: Types.ObjectId | null; // Ref: IUser (role: driver)
//     pickup: ILocation;
//     destination: ILocation;
//     fare: number;
//     status: RIDER_STATUS;
//     statusHistory: IRideStatusHistory[];
//     requestedAt: Date;
//     acceptedAt?: Date;
//     pickedUpAt?: Date;
//     completedAt?: Date;
//     cancelledAt?: Date;
// }

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