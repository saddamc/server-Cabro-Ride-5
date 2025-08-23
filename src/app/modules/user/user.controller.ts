/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import passport from "passport";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { setAuthCookie } from "../../utils/setCookie";
import { createUserTokens } from "../../utils/userToken";
import { UserServices } from "./user.service";


// ✅✅ credentialsLogin/Google Login
const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    passport.authenticate("local", async (err: any, user: any, info: any) => {

      if (err) {
        return next(new AppError(401, err))
      }

      if (!user) {
        return next(new AppError(401, info.message))
      }

      const userTokens = createUserTokens(user)

      const { password: pass, ...rest } = user.toObject();     

    setAuthCookie(res, userTokens); 

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Logged in Successfully",
      data: {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: rest
      },
    });
    } )(req, res, next)    
  }
);


// ✅ createUser
const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.createUser(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Created Successfully",
      data: user,
    });
  }
);

// ✅ updateUser
const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("Updated user:", req.body);
    const userId = req.params.id;

    const verifiedToken = req.user;

    const payload = req.body;
    const user = await UserServices.updateUser(userId, payload, verifiedToken as JwtPayload)
    console.log("Updated user:", user);
    
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Updated Successfully",
      data: user,
    });
  }
);

// ✅ getAllUsers
const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserServices.getAllUsers();

    if (!result.data || result.data.length === 0) {
      return next(new AppError(httpStatus.NOT_FOUND, "No users found"));
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "All Users retrieved Successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

// ✅ getMe
const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload
    const result = await UserServices.getMe(decodedToken.userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Your profile Retrieved Successfully",
      data: result.data,
    });
  }
);

// ✅ getSingleUser
const getSingleUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await UserServices.getSingleUser(id);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "User Retrieved Successfully",
        data: result.data
    })
})

// ✅ Active / Blocked user
const setBlocked = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  // console.log("online id✅:", id)

    const result = await UserServices.setBlocked(id)

        sendResponse(res, {
        statusCode: 201,
        success: true,
        message:` Driver available: 👀 ${result?.isActive}`,
        data: result,
        });
})



export const UserControllers = {
  createUser,
  credentialsLogin,
  getAllUsers,
  updateUser,
  getMe,
  getSingleUser,
  setBlocked,
};

