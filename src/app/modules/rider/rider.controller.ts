/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { RideService } from './rider.service';

// ✅ Request Ride
const requestRide = catchAsync(async (req: Request, res: Response) => {
    const id = req.user as JwtPayload
    console.log("idDriver✅:", id)
    const payload = {
        ...req.body,
        rider: id.userId  
    }
    const result = await RideService.requestRide(payload);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Ride created successfully',
        data: result,
    });
});


// ✅ Cancel Ride
const cancelRide = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const rideId = req.params.id;
    // console.log("CANCEL ID:", user, rideId);

    const payload = {
        ...req.body,
        status: "cancelled",
        cancellation: {
        cancelledBy: "rider",
        reason: "Rider decided to cancel", 
        cancelledAt: new Date(),
        },
    };

    const result = await RideService.cancelRide(rideId, user, payload);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Ride cancelled successfully",
        data: result,
    });
});


// ✅ Ride History
const getMyRides = catchAsync(async (req: Request, res: Response) => {
    const result = await RideService.getMyRides(req as any);

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
        message: "All Ride Retrieved Successfully",
        data: result.data,
        meta: result.meta
    })
})

// ✅ 
const ratingRide = async (req: Request, res: Response) => {

        const riderId = (req.user as any).userId; 
        const { id } = req.params;
        const { rating, feedback } = req.body;
        // console.log("controller ✅:", riderId, id, rating, feedback)

        if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }
    const result = await RideService.ratingRide(id, riderId, rating, feedback);
    
    sendResponse(res, {
        statusCode: 200,
        success: true, 
        message: "Rating Successfully",
        data: result,
    })
}


export const RideController = {
    requestRide,
    cancelRide,
    getAllRide, 
    getMyRides,
    ratingRide,
};