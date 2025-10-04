import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IsActive, IUser, Role } from "./user.interface";
import { User } from "./user.model";

// ✅ createUser
const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload; 

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist"); 
  }

  const hashedPassword = await bcryptjs.hash(password as string, Number(envVars.BCRYPT_SALT_ROUND));
  // console.log(password, hashedPassword);

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const user = await User.create({
    email,
    password: hashedPassword, 
    auths: [authProvider],
    ...rest,
  });
  return user;
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
