/* eslint-disable @typescript-eslint/no-explicit-any */
import { model, Schema } from 'mongoose';


import { IAdditionalInfo, IDocuments, IDriver, IEarnings, ILocation, IRating, IVehicleType } from './driver.interface';

const VehicleInfoSchema = new Schema<IVehicleType>({
  category: {
    type: String,
    enum: ['CAR', 'BIKE'],
    required: true,
    uppercase: true
  },
  make: { type: String, uppercase: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  plateNumber: { type: String, unique:true, required: true, uppercase: true },
  color: {type:String}
},
  {
    _id: false
  },
);

const LocationSchema = new Schema<ILocation>({
  coordinates: {
    type: [Number, Number], // [longitude, latitude]  
  },
    address: { type: String, required: true },
    lastUpdated: { type: Date, default:Date.now },
  },
  {
    _id: false
  },
);

const EarningsSchema = new Schema<IEarnings>({
  totalEarnings: { type: Number, default: 0 },
  weeklyEarnings: { type: Number, default: 0 },
  monthlyEarnings: { type: Number, default: 0 },
  lastResetDate: {type: Date},
},
  {
    _id: false
  },
);

const RatingSchema = new Schema<IRating>({
    average: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
},
  {
    _id: false
  },
);

const DocumentsSchema = new Schema<IDocuments>({
    licenseImage: { type: String },
    vehicleRegistration: { type: String },
    insurance: { type: String },
},
{
    _id: false
},
);

const AdditionalInfoSchema = new Schema<IAdditionalInfo>({
    experience: { type: String },
    references: { type: String },
},
{
    _id: false
},
);

// Main Driver Schema
const DriverSchema = new Schema<IDriver>(
    {
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        get: function(val: any) { return val ? val.toString() : val; }, // Convert ObjectId to string on get
        set: function(val: any) { return val; }  // Pass through on set
    },
    licenseNumber: { type: String, required: true, unique: true, uppercase: true },
    vehicleType: { type: VehicleInfoSchema},
    status: {
        type: String,
        enum: ['pending', 'approved', 'suspended', 'rejected'],
        default: 'pending',
        },
    availability: {
        type: String,
        enum: ['online', 'offline', 'busy'],
        default: 'offline',
        },
    location: { type: LocationSchema },
    earnings: { type: EarningsSchema, default: () => ({}) },
    rating: { type: RatingSchema, default: () => ({}) },
    documents: { type: DocumentsSchema },
    additionalInfo: { type: AdditionalInfoSchema },
    activeRide: { type: Schema.Types.ObjectId, ref: 'Ride', default: null },
    approvedAt: { type: Date },
    },
    { timestamps: true }
);

// ===== Instance Methods =====

// Update location
DriverSchema.methods.updateLocation = async function (
  longitude: number,
  latitude: number,
  address?: string
) {
  this.location.longitude = longitude;
  this.location.latitude = latitude;
  if (address) this.location.address = address;
  await this.save();
  return this;
};

// Update earnings
DriverSchema.methods.updateEarnings = async function (amount: number) {
  this.earnings.total += amount;
  await this.save();
  return this;
};

// Set availability
DriverSchema.methods.setAvailability = async function (
  status: 'online' | 'offline' | 'busy'
) {
  this.availability = status;
  await this.save();
  return this;
};

export const Driver = model<IDriver>('Driver', DriverSchema);
