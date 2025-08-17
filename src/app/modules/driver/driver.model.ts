import { model, Schema } from 'mongoose';


import { IDocuments, IDriver, IEarnings, ILocation, IRating, IVehicleType } from './driver.interface';

const VehicleInfoSchema = new Schema<IVehicleType>({
  make: { type: String, },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  plateNumber: { type: String, unique:true, required: true },
  color: {type:String}
});

const LocationSchema = new Schema<ILocation>({
  coordinates: { type: [Number], // [longitude, latitude]
    validate: {
      validator: (val: number[]) => val.length === 2,
      message: 'Coordinates must be [longitude, latitude]',
    } },
  address: { type: Number, required: true },
  lastUpdated: { type: Date },
});

const EarningsSchema = new Schema<IEarnings>({
  totalEarnings: { type: Number, default: 0 },
  weeklyEarnings: { type: Number, default: 0 },
  monthlyEarnings: { type: Number, default: 0 },
  lastResetDate: {type: Date},
});

const RatingSchema = new Schema<IRating>({
    average: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
});

const DocumentsSchema = new Schema<IDocuments>({
    licenseImage: { type: String },
    vehicleRegistration: { type: String },
    insurance: { type: String },
});

// Main Driver Schema
const DriverSchema = new Schema<IDriver>(
    {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    licenseNumber: { type: String, required: true, unique: true },
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
    activeRide: { type: Schema.Types.ObjectId, ref: 'Ride' },
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
