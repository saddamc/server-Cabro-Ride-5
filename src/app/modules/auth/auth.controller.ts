import { Request, Response, } from 'express';
/* eslint-disable @typescript-eslint/no-unused-vars */
 
import { NextFunction } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { setAuthCookie } from "../../utils/setCookie";
import { createUserTokens } from "../../utils/userToken";
import { User } from "../user/user.model";
import { AuthServices } from "./auth.service";


// ✅ getNewAccessToken
const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken; 
    if (!refreshToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No refresh token received from cookies"
      );
    }
    // const refreshToken = req.headers.authorization
    const tokenInfo = await AuthServices.getNewAccessToken(
      refreshToken as string
    );

    setAuthCookie(res, tokenInfo); 

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "New Access Token Retrieved Successfully",
      data: tokenInfo,
    });
  }
);

// ✅ logout
const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Logged out Successfully",
      data: null,
    });
  }
);

// ✅ changePassword
const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newPassword = req.body.newPassword;
    const oldPassword = req.body.oldPassword;
    const decodedToken = req.user;

    await AuthServices.changePassword(oldPassword, newPassword, decodedToken as JwtPayload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Changed Successfully",
      data: null,
    });
  }
)

// ✅ setPassword
const setPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const {password} = req.body;
    const decodedToken = req.user as JwtPayload;

    await AuthServices.setPassword(decodedToken.userId, password);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Set Successfully",
      data: null,
    });
  }
);

// ✅ forgotPassword
const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const { email } = req.body;

    await AuthServices.forgotPassword(email);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Reset Link Sent to Email",
      data: null,
    });
  }
);

// ✅ userVerification
const userVerification = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return next(new AppError(httpStatus.NOT_FOUND, "User not found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Verified Successfully",
      data: user, 
    });
  }
);



// ✅ googleCallbackController
const googleCallbackController = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  
  let redirectTo = req.query.state ? req.query.state as string : ""
  if (redirectTo.startsWith("/")) {
    redirectTo = redirectTo.slice(1)
  }

  const user = req.user;
  console.log("user", user) // show google user details 
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found")
  }
  const tokenInfo = createUserTokens(user)

  setAuthCookie(res, tokenInfo)
  
  res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`) 
});
  


export const AuthControllers = {
  getNewAccessToken,
  logout,
  changePassword,
  setPassword,
  forgotPassword,
  userVerification,
  googleCallbackController,
};
