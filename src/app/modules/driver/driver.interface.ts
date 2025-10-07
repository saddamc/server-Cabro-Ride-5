
import { Document, Types } from "mongoose";
import { IUser } from "../user/user.interface";

export interface IVehicleType {
    category: 'CAR' | 'BIKE';
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    color?: string;
}

export interface ILocation {
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
    lastUpdated: Date;
}


export interface IDriver extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId | IUser;
    licenseNumber: string;
    vehicleType: IVehicleType;
    status: 'pending' | 'approved' | 'suspended' | 'rejected';
    availability: 'online' | 'offline' | 'busy';
    location: ILocation;
    earnings: IEarnings;
    rating: IRating;
    documents?: IDocuments;
    additionalInfo?: IAdditionalInfo;
    activeRide?: Types.ObjectId | null;
    approvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    updateLocation(longitude: number, latitude: number, address?: string): Promise<IDriver>;
    updateEarnings(amount: number): Promise<IDriver>;
    setAvailability(status: 'online' | 'offline' | 'busy'): Promise<IDriver>; 
}

export interface IEarnings {
    totalEarnings: number;
    weeklyEarnings: number;
    monthlyEarnings: number;
    lastResetDate: Date;
}

export interface IRating {
    average: number;
    totalRatings: number;
}

export interface IDocuments {
    licenseImage?: string;
    vehicleRegistration?: string;
    insurance?: string;
}

export interface IAdditionalInfo {
    experience?: string;
    references?: string;
}

export interface IDriverStatusUpdate {
    status: 'approved' | 'rejected' | 'suspended';
    reason?: string;
}