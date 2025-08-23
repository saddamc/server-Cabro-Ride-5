import { Types } from "mongoose";

export enum Role {
  super_admin = "super_admin",
  admin = "admin",
  rider = "rider",
  driver = "driver",
}
export interface IAuthProvider {
  provider: "google" | "credentials"; 
  providerId: string;
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export interface IUser extends Document {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: Role;
  isActive?: IsActive;
  isVerified?: boolean;
  auths: IAuthProvider[];
  profilePicture?: string;
  address?: string;
  isDeleted?: boolean;  
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}
