import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { Driver } from "../driver/driver.model";
import { IAuthProvider, IsActive, IUser, Role } from "./user.interface";
import { User } from "./user.model";

// ✅ createUser
const createUser = async (payload: Partial<IUser>) => {
  const { email, password, role, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    // Use 409 Conflict for already existing resource instead of 400 Bad Request
    throw new AppError(httpStatus.CONFLICT, `User with email ${email} already exists`);
  }

  const hashedPassword = await bcryptjs.hash(password as string, Number(envVars.BCRYPT_SALT_ROUND));

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const session = await User.startSession();
  session.startTransaction();

  try {
    // Create the user
    const user = await User.create([{
      email,
      password: hashedPassword,
      auths: [authProvider],
      role,
      ...rest,
    }], { session });

    const createdUser = user[0];

    // If the user is registering as a driver, create a basic driver document
    if (role === Role.driver) {
      // Convert user ID to string to ensure consistent format
      const userId = createdUser._id.toString();
      
      // Generate a unique random plate number with timestamp to prevent conflicts
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const uniquePlateNumber = `TEMP-${timestamp}${randomNum}`;
      
      // Create a basic driver document with minimal required fields
      await Driver.create([{
        user: userId, // Use string ID to avoid ObjectId conversion issues
        licenseNumber: `PENDING-${Math.floor(100000 + Math.random() * 900000)}`, // Temporary license number
        status: 'pending',
        availability: 'offline',
        // Include a basic vehicleType with a unique plateNumber
        vehicleType: {
          category: 'CAR',
          make: 'PENDING',
          model: 'PENDING',
          year: new Date().getFullYear(),
          plateNumber: uniquePlateNumber, // Use the unique plate number
          color: 'PENDING'
        },
        // Include a basic location (can be updated later)
        location: {
          coordinates: [90.4125, 23.7928], // Default Dhaka coordinates
          address: "Dhaka, Bangladesh",
          lastUpdated: new Date()
        }
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    return createdUser;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ✅ updateUser
const updateUser = async (userId: string, payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {

  if (decodedToken.role === Role.rider || decodedToken.role === Role.driver) {
    if (userId !== decodedToken.userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized!");
    }
  }

  const ifUserExist = await User.findById(userId);
  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (decodedToken.role === Role.admin && ifUserExist.role === Role.super_admin) {        
    throw new AppError(401, "You are not authorized!!")
  }

  if (payload.role) {
    if (decodedToken.role === Role.rider || decodedToken.role === Role.driver) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized!!!")
    }

    if (payload.role === Role.super_admin && decodedToken.role === Role.admin) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized!!!!")
    }
  }

    if(payload.isActive || payload.isDeleted || payload.isVerified) {
      if (decodedToken.role === Role.rider || decodedToken.role === Role.driver) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized!!!!!")
    }
    }

    const newUpdateUser = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });

    return newUpdateUser;
  
  }
  
// ✅ getAllUsers
const getAllUsers = async () => {
  const users = await User.aggregate([
    {
      $lookup: {
        from: 'rides',
        let: { userId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$rider', '$$userId'] }, status: 'completed' } }
        ],
        as: 'rides'
      }
    },
    {
      $addFields: {
        totalRides: { $size: '$rides' }
      }
    },
    {
      $project: {
        rides: 0
      }
    }
  ]);

  const totalUsers = await User.countDocuments();

  return {
    data: users,
    meta: {
      total: totalUsers,
    },
  };
};

// ✅ getMe
const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user
  }
}

// ✅ getSingleUser
const getSingleUser = async (id: string) => {
  const user = await User.findById(id).select("-password");
  return {
    data: user
  }
}

// Active / Blocked user
const setBlocked = async (id: string) => {

    const user = await User.findById(id)
    // console.log("who:", user)
    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Not Found !")
    }

    if (user?.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is Inactive. ⚠️")
    }

    if (user?.isDeleted === true) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is Delected ⚠️");
    }

    const newStatus =
    user.isActive === IsActive.ACTIVE ? IsActive.BLOCKED : IsActive.ACTIVE;

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { isActive: newStatus },
        { new: true }
    );

    return updatedUser;
}



export const UserServices = {
  createUser,
  getAllUsers, 
  updateUser,
  getMe, 
  getSingleUser,
  setBlocked,
};
