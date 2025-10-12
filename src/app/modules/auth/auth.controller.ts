/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { Request, Response, } from 'express';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import passport from 'passport';
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { setAuthCookie } from "../../utils/setCookie";
import { createUserTokens } from "../../utils/userToken";
import { IUser } from '../user/user.interface';
import { AuthServices } from "./auth.service";


// ✅ User credientialsLogin
const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // const loginInfo = await AuthServices.credentialsLogin(req.body);

    passport.authenticate("local", async (err: any, user: any, info: any) => {

      if (err) {
        
        // return next(err)  //show global error
        return next(new AppError(401, err))
        // return next(new AppError(err.statusCode || 401, err.message))
      }

      if (!user) {
        // console.log("from !user")

        // return new AppError(404, info.message)
        return next(new AppError(401, info.message))
      }

      const userTokens = await createUserTokens(user)

      // delete user.toObject().password

      const { password: pass, ...rest } = user.toObject();     

      setAuthCookie(res, userTokens); 

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Logged in Successfully",
      data: {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: rest,
      },
    });
    } )(req, res, next)    
  }
);




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
    // Clear cookies with the same settings used when setting them
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    const clearCookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
      domain: isProduction ? ".ride-5.vercel.app" : undefined,
    };

    res.clearCookie("accessToken", clearCookieOptions);
    res.clearCookie("refreshToken", clearCookieOptions);

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

// ✅ resetPassword
const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const { userId, token, newPassword } = req.body;

    await AuthServices.resetPassword(userId, token, newPassword);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Reset Successfully",
      data: null,
    });
  }
);


// ✅ googleCallbackController
const googleCallbackController = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  
  let redirectTo = req.query.state ? req.query.state as string : ""
  if (redirectTo.startsWith("/")) {
    redirectTo = redirectTo.slice(1)
  }

  const user = req.user as Partial<IUser>;
  // console.log("user", user) 
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found")
  }
  const tokenInfo = createUserTokens(user)

  setAuthCookie(res, tokenInfo)
  
  // Include the token in the URL for client-side storage
  const redirectUrl = `${envVars.FRONTEND_URL}/${redirectTo}?token=${tokenInfo.accessToken}`;
  console.log("Google auth redirecting to:", redirectUrl);
  
  res.redirect(redirectUrl) 
});
  


export const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
  logout,
  changePassword,
  setPassword,
  forgotPassword,
  resetPassword,
  googleCallbackController,
};
