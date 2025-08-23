/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from 'http-status-codes';
import AppError from "../../errorHelpers/AppError";
import { AuthRequest } from '../auth/auth.interface';
import { Driver } from '../driver/driver.model';
import { User } from '../user/user.model';
import { IRide } from "./rider.interface";
import { Ride } from './rider.model';


// ✅ Request Ride
const requestRide = async (payload: IRide) => {
    
    const {rider, pickupLocation, destinationLocation, notes } = payload; 

    const currentUser = await User.findById(rider)
    // console.log("User ID - 2 ✅:", currentUser)
    
    const newCurrentUser = currentUser?._id.toString()
    
    if (!newCurrentUser) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Not Found!")
    }

    const activeRide = await Ride.findOne({
        rider: rider,
        status: { $in: ['requested', 'accepted', 'driver_arrived', 'picked_up', 'in_transit'] }
    });

    if (activeRide) {
        throw new Error("You already has a ride request in progress.");
    }

    // Create the ride
    const ride = await Ride.create({
        rider: currentUser,
        pickupLocation,
        destinationLocation,
        notes,
        status: 'requested'
    });

        // Calculate estimated fare
    ride.calculateFare();
    await ride.save();

    // Populate rider information
    await ride.populate('rider', 'name phone profilePicture');

    return ride;
};


// ✅ Cancel Ride / update Ride
const cancelRide = async (id: string, userId: any, payload: any) => {
    const ride = await Ride.findById(id);
    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }
    if (!userId) { throw new AppError(httpStatus.BAD_REQUEST, "User Not Found!") }

    if (ride.status === "cancelled") {
        throw new AppError(httpStatus.BAD_REQUEST, 'Ride already cancelled');
    }

    if (["picked_up", "in_transit", "completed"].includes(ride.status)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Ride cannot be cancelled at this stage");
    }
// console.log("our problem✅:", ride.rider.toString(), userId.userId)
    // Matching User 
    if (ride.rider.toString() !== userId.userId) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to cancel this ride");
    }

    ride.status = payload.status;
    ride.cancellation = payload.cancellation;

    await ride.save();
    return ride;
};


// ✅ Ride History
const getMyRides = async (req: AuthRequest) => {
    const userId = req.user?.userId;
    console.log("my",userId)
    if (!userId) {
        return { message: "User ID is required" };
    }

    let user;
    try {
        user = await User.findById(userId);
        if (!user) {
        return { message: "User not found" };
        }
    } catch (error) {
        return { message: "Error fetching user", error };
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    if (page < 1 || limit < 1) {
        return { message: "Invalid page or limit" };
    }
    const skip = (page - 1) * limit;

    const query: any = {};

    if (user.role === "rider") {
        query.rider = user._id;
    } else if (user.role === "driver") {
        let driver;
        try {
        driver = await Driver.findOne({ user: user._id });
        if (!driver) {
            return {
            total: 0,
            page,
            limit,
            rides: [],
            grouped: { completed: [], requested: [], cancelled: [] },
            message: "You have no history",
            };
        }
        query.driver = driver._id;
        } catch (error) {
        return { message: "Error fetching driver", error };
        }
    } else {
        return { message: "Invalid user role" };
    }

    let rides;
    let total;
    try {
        rides = await Ride.find(query)
        .populate("rider", "name phone profilePicture")
        .populate({
            path: "driver",
            populate: { path: "user", select: "name phone profilePicture" },
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

        total = await Ride.countDocuments(query);
    } catch (error) {
        return { message: "Error fetching rides", error };
    }

    if (total === 0) {
        return {
        total,
        page,
        limit,
        rides: [],
        grouped: { completed: [], requested: [], cancelled: [] },
        message: "You have no history",
        };
    }

    // Group rides by status (only the paginated ones)
    const grouped: Record<string, any[]> = {
        completed: [],
        requested: [],
        cancelled: [],
    };

    rides.forEach((ride) => {
        if (ride.status === "completed") grouped.completed.push(ride);
        else if (ride.status === "requested") grouped.requested.push(ride);
        else if (ride.status === "cancelled") grouped.cancelled.push(ride);
    });

    return {
        total,
        page,
        limit,
        rides,
        grouped,
    };
};


// ✅ Get all Ride
const getAllRide = async () => {
    const rides = await Ride.find({});
    const totalRides = await Ride.countDocuments()

    return {
        data: rides,
        meta: {
            total: totalRides
        }
    }
}

// ✅ Rating Ride
const ratingRide = async (id: string, riderId: string, rating: number, feedback?: string) => {

    const ride = await Ride.findById(id);
    // console.log("service ✅", id, riderId, rating, feedback)
    if (!ride) {
        throw new Error("Ride not found");
    }

    if (ride.rider.toString() !== riderId.toString()) {
        throw new Error("You are not authorized to rate this ride");
    }

    if (ride.status !== "completed") {
        throw new Error("You can only rate a completed ride");
    }

    ride.rating = {
        ...ride.rating,
        riderRating: rating,
        riderFeedback: feedback,
    };

    await ride.save();

    return ride;
};




export const RideService = {
    requestRide,
    cancelRide,
    getAllRide,
    getMyRides,
    ratingRide,
};