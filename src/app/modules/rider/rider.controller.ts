/* eslint-disable @typescript-eslint/no-explicit-any */

 

import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { RideService } from './rider.service';

// ✅ Request Ride
export const requestRide = catchAsync(async (req: Request, res: Response) => {
    const result = await RideService.requestRide(req as any);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Ride created successfully',
        data: result,
    });
});


// ✅ Cancel Ride
const cancelRide = catchAsync(async (req: Request, res: Response) => {
    const id = req.body.id;   
    // console.log("last Cancel Ride ID:", id);
    const payload = {
        ...req.body,
        status: "cancelled",
    }
    const result = await RideService.cancelRide(id, payload);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Ride cancelled successfully",
        data: result,
    });
});

// ✅ Ride History
export const getRideHistory = catchAsync(async (req: Request, res: Response) => {

    const result = await RideService.getRideHistory(req as any);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Ride history retrieved successfully",
        data: result,
    });
});




// ✅ Get all Ride
const getAllRide = catchAsync(async (req: Request, res: Response) => {
    const result = await RideService.getAllRide();

    sendResponse(res, {
        statusCode: 200,
        success: true, 
        message: "Ride Retrieved Successfully",
        data: result.data,
        meta: result.meta
    })
})


export const RideController = {
    requestRide,
    cancelRide,
    getAllRide, 
    getRideHistory
};