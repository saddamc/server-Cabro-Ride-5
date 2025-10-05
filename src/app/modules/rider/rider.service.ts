/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from 'http-status-codes';
import AppError from "../../errorHelpers/AppError";
import { AuthRequest } from '../auth/auth.interface';
import { Driver } from '../driver/driver.model';
import { PAYMENT_STATUS } from '../payment/payment.interface';
import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
import { IRide, RIDE_STATUS } from "./rider.interface";
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

    // If the ride had a driver assigned, free the driver
    if (ride.driver) {
        await Driver.findByIdAndUpdate(ride.driver, { availability: "online", activeRide: null });
    }

    await ride.save();
    return ride;
};


// ✅ Ride History
const getMyRides = async (req: AuthRequest) => {
    const userId = req.user?.userId;
    // console.log("my",userId)
    if (!userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
    }

    let user;
    try {
        user = await User.findById(userId);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, "User not found");
        }
    } catch {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching user");
    }


    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    if (page < 1 || limit < 1) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid page or limit");
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
                // Return empty result instead of error for drivers without history
                return {
                    total: 0,
                    page,
                    limit,
                    rides: [],
                    grouped: { completed: [], requested: [], cancelled: [] },
                };
            }
            query.driver = driver._id;
        } catch {
            throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching driver");
        }
    } else {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid user role");
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
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching rides");
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
const getAllRide = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const rides = await Ride.find({})
        .populate("rider", "name phone profilePicture email")
        .populate({
            path: "driver",
            populate: { path: "user", select: "name phone profilePicture" },
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    const totalRides = await Ride.countDocuments();

    return {
        data: rides,
        meta: {
            total: totalRides,
            page,
            limit,
            totalPages: Math.ceil(totalRides / limit)
        }
    }
}

// ✅ Get all bookings for admin dashboard
const getAllBookingsForAdmin = async () => {
    const bookings = await Ride.find({})
        .populate("rider", "name phone profilePicture email")
        .populate({
            path: "driver",
            populate: { path: "user", select: "name phone profilePicture" },
        })
        .sort({ createdAt: -1 })
        .limit(10); // Get last 10 bookings

    const formattedBookings = bookings.map(booking => ({
        id: booking._id.toString(),
        date: booking.createdAt.toISOString(),
        status: booking.status,
        amount: booking.fare?.totalFare || 0
    }));

    return {
        bookings: formattedBookings
    };
}

// ✅ Get earnings data for admin dashboard
const getEarningsData = async () => {
    const currentYear = new Date().getFullYear();

    // Aggregate earnings by month for current year
    const earnings = await Ride.aggregate([
        {
            $match: {
                status: 'completed',
                createdAt: {
                    $gte: new Date(currentYear, 0, 1), // Start of current year
                    $lt: new Date(currentYear + 1, 0, 1)   // Start of next year
                }
            }
        },
        {
            $group: {
                _id: { $month: '$createdAt' },
                amount: { $sum: '$fare.totalFare' }
            }
        },
        {
            $sort: { '_id': 1 }
        }
    ]);

    // Format the data to match what the frontend expects
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const formattedEarnings = earnings.map(item => ({
        month: monthNames[item._id - 1],
        amount: item.amount
    }));

    // If no earnings data, provide some mock data for demonstration
    if (formattedEarnings.length === 0) {
        return {
            earnings: [
                { month: 'January', amount: 15000 },
                { month: 'February', amount: 18000 },
                { month: 'March', amount: 22000 },
                { month: 'April', amount: 19000 },
                { month: 'May', amount: 25000 },
                { month: 'June', amount: 21000 }
            ]
        };
    }

    return {
        earnings: formattedEarnings
    };
}

// ✅ Get Active Ride for Current User
const getActiveRide = async (req: AuthRequest) => {
    const userId = req.user?.userId;
    if (!userId) {
        return null;
    }

    let user;
    try {
        user = await User.findById(userId);
    } catch {
        return null;
    }

    let activeStatuses;
    if (user?.role === "rider") {
        activeStatuses = ['requested', 'accepted', 'picked_up', 'in_transit', 'payment_pending', 'payment_completed'];
    } else if (user?.role === "driver") {
        activeStatuses = ['requested', 'accepted', 'picked_up', 'in_transit', 'payment_pending', 'payment_completed', 'completed'];
    } else {
        activeStatuses = ['requested', 'accepted', 'picked_up', 'in_transit', 'payment_pending', 'payment_completed'];
    }

    const activeRide = await Ride.findOne({
        $or: [
            { rider: userId },
            { driver: userId }
        ],
        status: { $in: activeStatuses }
    })
    .populate('rider', 'name phone profilePicture')
    .populate({
        path: 'driver',
        populate: { path: 'user', select: 'name phone profilePicture' }
    });

    return activeRide;
};

// ✅ Get available rides for drivers
const getAvailableRides = async () => {
    const availableRides = await Ride.find({
        status: 'requested',
        driver: null
    })
    .populate('rider', 'name phone profilePicture')
    .sort({ createdAt: -1 });

    return availableRides;
};

// ✅ Rating Ride
const ratingRide = async (id: string, userId: string, rating: number, feedback?: string) => {

    const ride = await Ride.findById(id);
    // console.log("service ✅", id, userId, rating, feedback)
    if (!ride) {
        throw new Error("Ride not found");
    }

    if (ride.status !== "completed") {
        throw new Error("You can only rate a completed ride");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    if (user.role === "rider") {
        if (ride.rider.toString() !== userId.toString()) {
            throw new Error("You are not authorized to rate this ride");
        }
        ride.rating = {
            ...ride.rating,
            riderRating: rating,
            riderFeedback: feedback,
        };
    } else if (user.role === "driver") {
        const driver = await Driver.findOne({ user: userId });
        if (!driver || !ride.driver || ride.driver.toString() !== driver._id.toString()) {
            throw new Error("You are not authorized to rate this ride");
        }
        ride.rating = {
            ...ride.rating,
            driverRating: rating,
            driverFeedback: feedback,
        };
    } else {
        throw new Error("Invalid user role");
    }

    await ride.save();

    return ride;
};

// ✅ Complete Payment
const completePayment = async (id: string, userId: string, method: string) => {
    const ride = await Ride.findById(id);
    if (!ride) {
        throw new Error("Ride not found");
    }

    if (ride.status !== "payment_pending") {
        throw new Error("Payment not required");
    }

    // Check if user is the rider
    if (ride.rider.toString() !== userId.toString()) {
        throw new Error("You are not authorized to complete payment for this ride");
    }

    // Get driver info to create payment record
    const driver = await Driver.findById(ride.driver);
    if (!driver) {
        throw new Error("Driver not found");
    }

    // Create a payment record
    try {
        // Generate a transaction ID based on payment method
        let transactionId;
        if (method === 'cash') {
            // For cash payments, use a special prefix
            transactionId = `CASH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        } else {
            // For digital payments
            transactionId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        // Create payment record with the appropriate transaction ID
        const payment = await Payment.create({
            rider: ride.rider,
            driver: ride.driver,
            transactionId: transactionId,
            amount: ride.fare.totalFare,
            status: PAYMENT_STATUS.PAID
        });
        
        // Update ride with payment reference and status
        ride.status = "payment_completed";
        ride.paymentStatus = RIDE_STATUS.COMPLETE;
        ride.paymentMethod = method;  // Store payment method
        ride.payment = payment._id;   // Link to payment record
        
        await ride.save();

        return ride;
    } catch {
        throw new Error("Failed to process payment");
    }
};




// ✅ Get Ride by ID
const getRideById = async (id: string, userId: string) => {
    const ride = await Ride.findById(id)
        .populate("rider", "name phone profilePicture")
        .populate({
            path: "driver",
            populate: { path: "user", select: "name phone profilePicture" },
        });

    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    // Check if user has permission to view this ride
    if (ride.rider.toString() !== userId) {
        // Check if user is the driver
        const driver = await Driver.findOne({ user: userId });
        if (!driver || !ride.driver || ride.driver.toString() !== driver._id.toString()) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to view this ride");
        }
    }

    return ride;
};

// ✅ Get ride volume data for dashboard (daily rides over last 30 days)
const getRideVolumeData = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const volumeData = await Ride.aggregate([
        {
            $match: {
                createdAt: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt"
                    }
                },
                totalRides: { $sum: 1 },
                completedRides: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                },
                cancelledRides: {
                    $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
                }
            }
        },
        {
            $sort: { "_id": 1 }
        }
    ]);

    // Fill in missing dates with 0 values
    const result = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayData = volumeData.find(d => d._id === dateStr);
        result.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            rides: dayData?.totalRides || 0,
            completed: dayData?.completedRides || 0,
            cancelled: dayData?.cancelledRides || 0,
        });
    }

    return result;
};

// ✅ Get driver activity data for dashboard (24h)
const getDriverActivityData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activityData = await Ride.aggregate([
        {
            $match: {
                createdAt: { $gte: today, $lt: tomorrow }
            }
        },
        {
            $group: {
                _id: { $hour: "$createdAt" },
                activeDrivers: { $addToSet: "$driver" },
                bookings: { $sum: 1 }
            }
        },
        {
            $project: {
                hour: "$_id",
                activeDrivers: { $size: { $ifNull: ["$activeDrivers", []] } },
                bookings: 1
            }
        },
        {
            $sort: { hour: 1 }
        }
    ]);

    // Fill in all 24 hours with data
    const result = [];
    for (let hour = 0; hour < 24; hour++) {
        const hourData = activityData.find(d => d.hour === hour);
        result.push({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            activeDrivers: hourData?.activeDrivers || 0,
            bookings: hourData?.bookings || 0,
        });
    }

    return result;
};

export const RideService = {
    requestRide,
    cancelRide,
    getAllRide,
    getAllBookingsForAdmin,
    getEarningsData,
    getMyRides,
    getActiveRide,
    getAvailableRides,
    getRideById,
    ratingRide,
    completePayment,
    getRideVolumeData,
    getDriverActivityData,
};