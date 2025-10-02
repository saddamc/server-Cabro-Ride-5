/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { RideService } from './rider.service';

// ✅ Request Ride
const requestRide = catchAsync(async (req: Request, res: Response) => {
    const id = req.user as JwtPayload
    // console.log("idDriver✅:", id)
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


// ✅ Get Active Ride for Current User
const getActiveRide = catchAsync(async (req: Request, res: Response) => {
    const result = await RideService.getActiveRide(req as any);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Active ride retrieved successfully",
        data: result,
    });
});

// ✅ Get all Ride
const getAllRide = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const result = await RideService.getAllRide(page, limit);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "All Ride Retrieved Successfully",
        data: result.data,
        meta: result.meta
    })
})

// ✅ Get all bookings for admin
const getAllBookingsForAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await RideService.getAllBookingsForAdmin();

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "All Bookings Retrieved Successfully",
        data: result
    })
})

// ✅ Get earnings data for admin
const getEarningsData = catchAsync(async (req: Request, res: Response) => {
    const result = await RideService.getEarningsData();

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Earnings Data Retrieved Successfully",
        data: result
    })
})

// ✅ Get available rides for drivers
const getAvailableRides = catchAsync(async (req: Request, res: Response) => {
    const result = await RideService.getAvailableRides();

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Available rides retrieved successfully",
        data: result,
    });
});

// ✅ Rating Ride
const ratingRide = async (req: Request, res: Response) => {

        const userId = (req.user as any).userId;
        const { id } = req.params;
        const { rating, feedback } = req.body;
        // console.log("controller ✅:", userId, id, rating, feedback)

        if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }
    const result = await RideService.ratingRide(id, userId, rating, feedback);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Rating submitted successfully",
        data: result,
    });
};

// ✅ Complete Payment
const completePayment = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as any).userId;
    const { id } = req.params;
    const { method } = req.body;

    const result = await RideService.completePayment(id, userId, method);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Payment completed successfully",
        data: result,
    });
});


// ✅ Get Ride by ID
const getRideById = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as any).userId;
    const { id } = req.params;

    const result = await RideService.getRideById(id, userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Ride retrieved successfully",
        data: result,
    });
});

export const RideController = {
    requestRide,
    cancelRide,
    getAllRide,
    getAllBookingsForAdmin,
    getEarningsData,
    getMyRides,
    getAvailableRides,
    getActiveRide,
    getRideById,
    ratingRide,
    completePayment,
};