/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response } from 'express';
import httpStatus from "http-status-codes";
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../errorHelpers/AppError';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { IDriver } from './driver.interface';
import { DriverService } from './driver.service';


// ✅ Approval Driver status
const approvedDriver = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await DriverService.approvedDriver(id)
    // console.log("set Online✅:", result)

        sendResponse(res, {
        statusCode: 201,
        success: true,
        message:` Driver available: 👀 ${result?.status}`,
        data: result,
        });
})

// ✅ applyDriver
const applyDriver = catchAsync(async (req: Request, res: Response) => {
const userFromToken = req.user as JwtPayload; 
    
    const payload: IDriver = {
        ...req.body,
        user: userFromToken.userId,
    };

    const result = await DriverService.applyDriver(payload);
    

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Driver application submitted successfully",
        data: result,
    });
})

// ✅ online Driver status
const setOnlineOffline = catchAsync(async (req: Request, res: Response) => {
  // const { id } = req.params;
  // console.log("online id✅:", id)
  const idDriver = req.user as JwtPayload
  // console.log("idDriver✅:", idDriver)

    const result = await DriverService.setOnlineOffline(idDriver.userId)

        sendResponse(res, {
        statusCode: 201,
        success: true,
        message:` Driver available: 👀 ${result?.availability}`,
        data: result,
        });
})

// ✅ Accept Ride
const acceptRide = catchAsync(async (req: Request, res: Response):Promise<any> => {
    const { id } = req.params; 
    const driverId = req.user as JwtPayload
    // console.log("driverId ✅:", id)
  
  if (!id) {
      throw new AppError(httpStatus.BAD_REQUEST, "Ride ID is required")
    }
  
    if (!driverId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Driver ID is required")
    }
  
    const result = await DriverService.acceptRide(id, driverId.userId);
  
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Ride accepted successfully ✅",
      data: result,
    });
});
  
// ✅ Reject Ride
const rejectRide = catchAsync(async (req: Request, res: Response):Promise<any> => {
    const { id } = req.params; 
  const driverId = req.user as JwtPayload;
    // console.log("driverId ✅:", id)
  
  if (!id) {
      throw new AppError(httpStatus.BAD_REQUEST, "Ride ID is required")
    }
  
    if (!driverId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Driver ID is required")
    }
  
    const result = await DriverService.rejectRide(id, driverId.userId);
  
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Ride Cancelled successfully ✅",
      data: result,
    });
});

// ✅ Update Ride Status 
const updateRideStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const driver = req.user as JwtPayload; 
  const rating = req.body
  console.log("driverId ✅:", id, driver)

  const ride = await DriverService.updateRideStatus(id, driver.userId, rating);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Ride status moved to ${ride.status}`,
    data: ride,
  });
}

// ✅ Earning History
const driverEarnings = async (req: Request, res: Response) => {
  
  const driverUserId = req.user as JwtPayload

  const earnings = await DriverService.driverEarnings(driverUserId.userId);
  // console.log("payment ✅:", driverUserId);    

    sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Earning history fetched successfully",
    data: earnings,
  });
}




export const DriverController = {
    setOnlineOffline,
    approvedDriver,
    applyDriver,
    acceptRide,
    rejectRide,
    updateRideStatus,
    driverEarnings,
  }