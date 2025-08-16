import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/sendEmail";
import {
  createNewAccessTokenWithRefreshToken
} from "../../utils/userToken";
import { Driver } from "../driver/driver.model";
import { IAuthProvider, IsActive, Role } from "../user/user.interface";
import { User } from './../user/user.model';
import { AuthRequest } from "./auth.interface";


// ✅ getNewAccessToken
const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(
    refreshToken
  );

  return {
    accessToken: newAccessToken.accessToken,
  };
};

// ✅ changePassword
const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(decodedToken.userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const isOldPasswordMatch = await bcryptjs.compare(
    oldPassword,
    user.password as string
  );
  if (!isOldPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old Password does not match");
  }

  user.password = await bcryptjs.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  await user.save();
};

// ✅ forgotPassword
const forgotPassword = async (email: string) => {
  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (!isUserExist.isVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Please verify your email first");
  }

  if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
    throw new AppError(httpStatus.UNAUTHORIZED, `User is ${isUserExist.isActive}`);
  }

  if (isUserExist.isDeleted) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User is deleted");
  }

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  }

  const resetToken = jwt.sign(jwtPayload, envVars.JWT_ACCESS_SECRET, {
    expiresIn: "10m"
  })
  
  const resetUILink = `${envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;

  sendEmail({
    to: isUserExist.email,
    subject: "Reset Password",
    templateName: "forgotPassword",
    templateData: {
      name: isUserExist.name,
      resetUILink,
    }
  })
}

// ✅ userVerification
const userVerification = async (email: string) => {
  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isUserExist.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is already verified");
  }

  const verificationToken = jwt.sign(
    { userId: isUserExist._id, email: isUserExist.email },
    envVars.JWT_ACCESS_SECRET,
    { expiresIn: "1d" }
  );
  const verificationLink = `${envVars.FRONTEND_URL}/verify-user?token=${verificationToken}`;  
  sendEmail({
    to: isUserExist.email,
    subject: "Verify Your Account",
    templateName: "userVerification",
    templateData: {
      name: isUserExist.name,
      text: `Click on the link to verify your account: ${verificationLink}`,
    }
  });
}


// ✅ setPassword
const setPassword = async (userId: string, password: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.password) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already have a password");
  }

  if (user.password && user.auths.some(providerObject => providerObject.provider === "google")) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already has a password set. Now you can change the password from your profile.");
  }

  const hashedPassword = await bcryptjs.hash(
    password,
    Number(envVars.BCRYPT_SALT_ROUND)
  )

  const credentialProvider: IAuthProvider = {
    provider: "credentials",
    providerId: user.email,
  }

  const auths: IAuthProvider[] = [...user.auths, credentialProvider];
  
  user.password = hashedPassword;
  user.auths = auths;
  await user.save();

}

// ✅ updateProfile
// export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
//   try {
//     const { name, phone, profileImage, applyForDriver, vehicleInfo, licenseNumber } = req.body;
//     const userId = req.user?._id;

//     const updateData: any = {};
//     if (name) updateData.name = name;
//     if (phone) updateData.phone = phone;
//     if (profileImage) updateData.profileImage = profileImage;

//     const user = await User.findByIdAndUpdate(
//       userId,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     // Handle driver application
//     if (applyForDriver && user?.role === 'rider') {
//       if (!vehicleInfo || !licenseNumber) {
//         throw new AppError(httpStatus.EXPECTATION_FAILED, "Vehicle information and license number are required to apply for driver role")
//         // return;
//       }

//       // Check if driver profile already exists
//       const existingDriver = await Driver.findOne({ user: userId });
//       if (existingDriver) {
//         throw new AppError(httpStatus.EXPECTATION_FAILED, "Driver application already exists")
//       }

//             // Update user role to driver
//       if (user) {
//         try {
//           user.role = Role.driver;
//         await user.save();
//         } catch {
//           throw new AppError(httpStatus.EXPECTATION_FAILED, "Role change Fail !")
//         }
//       }

//       // Create driver profile
//       const driver = await Driver.create({
//         user: userId,
//         licenseNumber,
//         vehicleInfo,
//         status: 'pending'
//       });

//       return driver;



//      sendResponse(res, {
//         statusCode: 201,
//         success: true,
//         message: 'Driver application submitted successfully. Awaiting admin approval.',
//        data: {
//          user,
//          driverProfile: driver
//         }
//     });
//       return;
//     }
//     res.status(200).json({
//       success: true,
//       message: 'Profile updated successfully',
//       data: {
//         user
//       }
//     });

//   } catch (error: any) {
//     console.error('Update profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update profile',
//       error: error.message
//     });
//     }
//   };


const applyDriver = async (payload: AuthRequest) => {

  const { user } = payload;
  console.log("driver ID ✅:", user)

  const currentUser = await User.findById({ _id: user})
  
  const newCurrentUser = currentUser?._id.toString()
  // console.log("User ID - 2 ✅:", newCurrentUser)

    if (!currentUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Not Found!")
  }

  const existingDriver = await Driver.findOne({ driver: payload.driver });
    if (existingDriver) {
        throw new AppError(httpStatus.EXPECTATION_FAILED, "Driver application already exists")
  }

    if (user === newCurrentUser && currentUser) {
    currentUser.role = Role.driver
    await currentUser.save();
  }

  const driverDocs = await Driver.create(payload)
  
  return driverDocs;

}
  
  export const AuthServices = {
    getNewAccessToken,
    changePassword,
    forgotPassword,
    setPassword,
    userVerification,
    applyDriver,
  };