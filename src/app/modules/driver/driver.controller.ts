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

// ✅ Suspend Driver
const suspendDriver = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log("online id✅:", id)

    const result = await DriverService.suspendDriver(id)

        sendResponse(res, {
        statusCode: 201,
        success: true,
        message:` Driver available: 👀 ${result?.status}`,
        data: result,
        });
})

// ✅ Update Ride Status 
const updateRideStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const driver = req.user as JwtPayload; 
  // const rating = req.body
  // console.log("driverId ✅:", id, driver)

  const ride = await DriverService.updateRideStatus(id, driver.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Ride status moved to ${ride.status}`,
    data: ride,
  });
}

// ✅ Rating Ride
const ratingRide = async (req: Request, res: Response) => {

        const riderId = (req.user as any).userId; 
        const { id } = req.params;
        const { rating, feedback } = req.body;
        // console.log("controller ✅:", riderId, id, rating, feedback)

        if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }
    const result = await DriverService.ratingRide(id, riderId, rating, feedback);
    
    sendResponse(res, {
        statusCode: 200,
        success: true, 
        message: "Rating Successfully",
        data: result,
    })
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

// ✅ Update Driver
const updateDriverDoc = async (req: Request, res: Response) => {
  const driverId = (req.user as any).userId;
  const payload = req.body;

  const driver = await DriverService.updateDriverDoc(driverId, payload);
  // console.log("✅ Driver updated:", driver);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Driver update successfully",
    data: driver,
  });
}

// ✅ Search Driver
const findNearbyDrivers = async (req: Request, res: Response) => {
  try {
    const { lng, lat, distance } = req.query;
    if (!lng || !lat)
      return res.status(400).json({ success: false, message: "Longitude (lng) and latitude (lat) are required" });

    const drivers = await DriverService.findNearbyDrivers(
      parseFloat(lng as string),
      parseFloat(lat as string),
      distance ? parseInt(distance as string) : 5
    );

    res.status(200).json({ success: true, count: drivers.length, drivers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};



export const DriverController = {
  setOnlineOffline,
  approvedDriver,
  applyDriver,
  acceptRide,
  suspendDriver,
  rejectRide,
  updateRideStatus,
  ratingRide,
  driverEarnings,
  findNearbyDrivers,
  updateDriverDoc,
  }