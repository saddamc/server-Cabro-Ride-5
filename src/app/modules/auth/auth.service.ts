import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/sendEmail";
import {
  createNewAccessTokenWithRefreshToken
} from "../../utils/userToken";
import { IAuthProvider, IsActive } from "../user/user.interface";
import { User } from './../user/user.model';


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
console.log("isUserExist.isVerified✅:", isUserExist.isVerified)
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


  
  export const AuthServices = {
    getNewAccessToken,
    changePassword,
    forgotPassword,
    setPassword,
    userVerification,
  };