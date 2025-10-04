 
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IsActive } from "./user.interface";
import { User } from "./user.model";
import { UserServices } from "./user.service";




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
    // console.log("Updated user:", req.body);
    const userId = req.params.id;

    const verifiedToken = req.user;

    const payload = req.body;
    const user = await UserServices.updateUser(userId, payload, verifiedToken as JwtPayload)
    // console.log("Updated user:", user);
    
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

// ✅ Activate user
const activateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

    const user = await User.findById(id)
    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Not Found !")
    }

    if (user.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is Deleted ⚠️");
    }

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { isActive: IsActive.ACTIVE },
        { new: true }
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User activated successfully",
        data: updatedUser,
    });
})

// ✅ Suspend user
const suspendUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

    const user = await User.findById(id)
    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Not Found !")
    }

    if (user.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is Deleted ⚠️");
    }

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { isActive: IsActive.INACTIVE },
        { new: true }
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User suspended successfully",
        data: updatedUser,
    });
})

export const UserControllers = {
  createUser,
  getAllUsers,
  updateUser,
  getMe,
  getSingleUser,
  setBlocked,
  activateUser,
  suspendUser,
};

