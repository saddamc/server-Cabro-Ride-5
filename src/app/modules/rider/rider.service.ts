/* eslint-disable @typescript-eslint/no-explicit-any */


 
import httpStatus from 'http-status-codes';
import AppError from "../../errorHelpers/AppError";
import { AuthRequest } from '../auth/auth.interface';
import { Driver } from '../driver/driver.model';
import { User } from '../user/user.model';
import { IRide, IRideRequest } from "./rider.interface";
import { Ride } from './rider.model';


// ✅ Request Ride
const requestRide = async (req: AuthRequest, res: Response): Promise<IRide> => {
    
    const { pickupLocation, destinationLocation, notes }: IRideRequest = req.body;
    const user = req.body.rider;    

    const currentUser = await User.findById({ _id: user})
    
    const newCurrentUser = currentUser?._id.toString()
      // console.log("User ID - 2 ✅:", newCurrentUser)
    
        if (!newCurrentUser) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Not Found!")
    }

    const activeRide = await Ride.findOne({
        rider: user,
        status: { $in: ['requested', 'accepted', 'driver_arrived', 'picked_up', 'in_transit'] }
    });

    if (activeRide) {
        throw new Error("This rider already has a ride request in progress.");
    }

    // Create the ride
    const ride = await Ride.create({
        rider: user,
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
const cancelRide = async (id: string, payload: IRide,) => {
    
    const user = payload.id
    console.log("Cancel Ride ID✅:", user);

    const ride = await Ride.findById(user);
    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Please provide a valid ID!");
    }

    if (ride.status === "cancelled") {
        throw new AppError(httpStatus.BAD_REQUEST, "Ride already cancelled!");
    }

    if (ride.status === "completed") {
        throw new AppError(httpStatus.BAD_REQUEST, "Completed ride cannot be cancelled!");
    }

    const updatedRide = await Ride.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true, runValidators: true }
    );

    return updatedRide;
};

// ✅ Ride History
const getRideHistory = async (req: AuthRequest) => {
    const userId = req.params.id;
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
        // Note: Unhandled statuses are ignored; add more if needed
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



export const RideService = {
    requestRide,
    cancelRide,
    getAllRide,
    getRideHistory
};