/* eslint-disable @typescript-eslint/no-explicit-any */
// import { model, Schema } from "mongoose";
// import { ILocation } from "../driver/driver.interface";
// import { IRide, RIDER_STATUS } from "./rider.interface";

// export const locationSchema = new Schema<ILocation>(
//     {
//         type: { type: String},
//         coordinates: {
//         type: [Number, Number],
//         required: true,
//         validate: {
//             validator: (val: number[]) =>
//             Array.isArray(val) &&
//             val.length === 2 &&
//             val.every((n) => typeof n === "number"),
//             message: "coordinates must be [lng, lat]",
//         },
//         },
//         address: { type: String },
//     },
//     { _id: false, versionKey: false, timestamps: true, }
// );


// const RideStatusHistorySchema = new Schema({
//     status: { type: String, enum: Object.values(RIDER_STATUS), default: RIDER_STATUS.REQUESTED },
//     timestamp: { type: Date, default: Date.now },
//     changeBy: { type: Schema.Types.ObjectId, ref: "User" },
// }, {
//     _id: false
// });

// const rideSchema = new Schema<IRide>({
//     riderId: { type: Schema.Types.ObjectId, ref: "User" },
//     driverId: { type: Schema.Types.ObjectId, ref: "User", default: null },
//     pickup: { type: locationSchema },
//     destination: { type: locationSchema },
//     fare: { type: Number, default: null },
//     status: {type: String, enum: Object.values(RIDER_STATUS), default: RIDER_STATUS.REQUESTED, required: true},
//     statusHistory: { type: [RideStatusHistorySchema], default: [] },
//     requestedAt: { type: Date, default: Date.now },
//     acceptedAt: { type: Date },
//     pickedUpAt: { type: Date },
//     completedAt: { type: Date },
//     cancelledAt: { type: Date },
// },
//     { timestamps: true}
// )


// export const Ride = model<IRide>("Ride", rideSchema)



import { model, Schema } from 'mongoose';
import { IRide, RideStatus } from './rider.interface';


const rideSchema = new Schema<IRide>({
  rider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  pickupLocation: {
    address: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Pickup coordinates are required'],
      validate: {
        validator: function(v: number[]) {
          return v.length === 2;
        },
        message: 'Coordinates must contain exactly 2 values [longitude, latitude]'
      }
    }
  },
  destinationLocation: {
    address: {
      type: String,
      required: [true, 'Destination address is required'],
      trim: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Destination coordinates are required'],
      validate: {
        validator: function(v: number[]) {
          return v.length === 2;
        },
        message: 'Coordinates must contain exactly 2 values [longitude, latitude]'
      }
    }
  },
  status: {
    type: String,
    enum: [
      'requested',
      'accepted',
      'driver_arrived',
      'picked_up',
      'in_transit',
      'completed',
      'cancelled',
      'no_driver_found'
    ],
    default: 'requested'
  },
  fare: {
    baseFare: {
      type: Number,
      default: 0,
      min: 0
    },
    distanceFare: {
      type: Number,
      default: 0,
      min: 0
    },
    timeFare: {
      type: Number,
      default: 0,
      min: 0
    },
    totalFare: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  distance: {
    estimated: {
      type: Number, // in kilometers
      default: 0
    },
    actual: {
      type: Number, // in kilometers
      default: 0
    }
  },
  duration: {
    estimated: {
      type: Number, // in minutes
      default: 0
    },
    actual: {
      type: Number, // in minutes
      default: 0
    }
  },
  timestamps: {
    requested: {
      type: Date,
      default: Date.now
    },
    accepted: Date,
    driverArrived: Date,
    pickedUp: Date,
    completed: Date,
    cancelled: Date
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['rider', 'driver', 'admin'],
      default: null
    },
    reason: {
      type: String,
      trim: true,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  rating: {
    riderRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    driverRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    riderFeedback: {
      type: String,
      trim: true,
      default: null
    },
    driverFeedback: {
      type: String,
      trim: true,
      default: null
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
rideSchema.index({ rider: 1, status: 1 });
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ status: 1, createdAt: -1 });
rideSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
rideSchema.index({ 'destinationLocation.coordinates': '2dsphere' });

// Update status timestamps
// rideSchema.pre('save', function(next) {
//   if (this.isModified('status')) {
//     const now = new Date();
    
//     switch (this.status) {
//       case 'accepted':
//         if (!this.timestamps.accepted) {
//           this.timestamps.accepted = now;
//         }
//         break;
//       case 'driver_arrived':
//         if (!this.timestamps.driverArrived) {
//           this.timestamps.driverArrived = now;
//         }
//         break;
//       case 'picked_up':
//         if (!this.timestamps.pickedUp) {
//           this.timestamps.pickedUp = now;
//         }
//         break;
//       case 'completed':
//         if (!this.timestamps.completed) {
//           this.timestamps.completed = now;
//           // Calculate actual duration
//           if (this.timestamps.pickedUp) {
//             this.duration.actual = Math.round((now.getTime() - this.timestamps.pickedUp.getTime()) / (1000 * 60));
//           }
//         }
//         break;
//       case 'cancelled':
//         if (!this.timestamps.cancelled) {
//           this.timestamps.cancelled = now;
//         }
//         if (!this.cancellation?.cancelledAt) {
//           if (!this.cancellation) this.cancellation = {} as any;
//           this.cancellation.cancelledAt = now;
//         }
//         break;
//     }
//   }
  
//   next();
// });

// Methods
rideSchema.methods.updateStatus = function(newStatus: RideStatus, updatedBy?: string): Promise<IRide> {
  const validTransitions: Record<RideStatus, RideStatus[]> = {
    requested: ['accepted', 'cancelled', 'no_driver_found'],
    accepted: ['driver_arrived', 'cancelled'],
    driver_arrived: ['picked_up', 'cancelled'],
    picked_up: ['in_transit'],
    in_transit: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
    no_driver_found: []
  };

  if (!validTransitions[this.status as RideStatus].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  
  if (newStatus === 'cancelled' && updatedBy) {
    if (!this.cancellation) this.cancellation = {} as any;
    this.cancellation.cancelledBy = updatedBy as 'rider' | 'driver' | 'admin';
  }
  
  return this.save();
};

rideSchema.methods.cancel = function(cancelledBy: string, reason?: string): Promise<IRide> {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledBy: cancelledBy as 'rider' | 'driver' | 'admin',
    reason,
    cancelledAt: new Date()
  };
  return this.save();
};

rideSchema.methods.calculateFare = function(): number {
  // Simple fare calculation - can be enhanced with more complex logic
  const baseFare = 5.00;
  const perKmRate = 1.50;
  const perMinuteRate = 0.25;
  
  this.fare.baseFare = baseFare;
  this.fare.distanceFare = (this.distance.estimated || 0) * perKmRate;
  this.fare.timeFare = (this.duration.estimated || 0) * perMinuteRate;
  this.fare.totalFare = this.fare.baseFare + this.fare.distanceFare + this.fare.timeFare;
  
  return this.fare.totalFare;
};

// Static methods
rideSchema.statics.getActiveRideForRider = function(riderId: string) {
  return this.findOne({
    rider: riderId,
    status: { $in: ['requested', 'accepted', 'driver_arrived', 'picked_up', 'in_transit'] }
  }).populate('driver', 'user vehicleInfo location rating')
    .populate('rider', 'name phone profileImage');
};

rideSchema.statics.getActiveRideForDriver = function(driverId: string) {
  return this.findOne({
    driver: driverId,
    status: { $in: ['accepted', 'driver_arrived', 'picked_up', 'in_transit'] }
  }).populate('rider', 'name phone profileImage');
};

export const Ride = model<IRide>('Ride', rideSchema);