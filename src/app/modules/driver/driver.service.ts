/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status-codes';
import AppError from "../../errorHelpers/AppError";
import { calculateDistance } from '../../utils/calculateDistance';
import { getTransactionId } from '../../utils/getTransaction';
import { PAYMENT_STATUS } from '../payment/payment.interface';
import { Payment } from '../payment/payment.model';
import { RIDE_STATUS, RideStatus, statusFlow } from '../rider/rider.interface';
import { Ride } from '../rider/rider.model';
import { ISSLCommerz } from '../sslCommerz/sslCommerz.interface';
import { SSLService } from '../sslCommerz/sslCommerz.service';
import { Role } from '../user/user.interface';
import { User } from '../user/user.model';
import { IDriver } from './driver.interface';
import { Driver } from "./driver.model";


// ✅ Get Driver Details
const getDriverDetails = async (id: string) => {
    const driver = await Driver.findOne({ user: id }).populate("user");
    if (!driver) {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Found !");
    }

    // Calculate average rating from completed rides that have ratings
    const completedRides = await Ride.find({
        driver: driver._id,
        status: "completed"
    }).select('rating.riderRating');

    const ratings = completedRides
        .map(ride => ride.rating?.riderRating)
        .filter((rating): rating is number => rating != null && rating > 0);

    // Calculate average from available ratings (don't count rides without ratings)
    const averageRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

    // Return driver with calculated rating
    return {
        ...driver.toObject(),
        rating: {
            average: averageRating,
            totalRatings: ratings.length
        }
    };
};

// ✅ Approved Driver status by Admin
const approvedDriver = async (id: string) => {

    const driver = await Driver.findOne({ _id: id })
    if (!driver) {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Found !")
    }

    if (!driver.licenseNumber) {
        throw new AppError(httpStatus.BAD_REQUEST, "Add your License Number ⚠️")
    }
    if (!driver.vehicleType.make || !driver.vehicleType.model || !driver.vehicleType.plateNumber) {
        throw new AppError(httpStatus.BAD_REQUEST, "Update your Vehicle details ⚠️")
    }

    if (!driver.status as any === "pending" ) {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver status: can't pending, sorry don't try ⚠️")
    }

    const newStatus =
        driver.status === "pending"
            ? "approved"
            : driver.status === "approved"
            ? "rejected"
            : driver.status === "rejected"
            ? "approved" 
            : driver.status

    const updatedDriver = await Driver.findByIdAndUpdate(
        id,
        { status: newStatus },
        { new: true }
    );

    return updatedDriver;
}

// ✅ Driver Status => online / offline
const setOnlineOffline = async (id: any) => {

    const driver = await Driver.findOne({user: id })
    // console.log("who:", driver?._id.toString())
    if (!driver?._id) {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Found !")
    }
console.log(driver.status === "pending" )
    if (driver.status === "pending" ) {
        throw new AppError(httpStatus.BAD_REQUEST, "Your status: pending, Waiting for Approval.")
    }

    if (driver.status === "rejected" || driver.status === "suspended") {
        throw new AppError(httpStatus.BAD_REQUEST, "Update your documents or contact customer support. ⚠️")
    }

    if (driver.availability === "busy") {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver is currently busy and cannot change availability");
    }

    const newStatus =
    driver.availability === "online" ? "offline" : "online";

    const updatedDriver = await Driver.findByIdAndUpdate(
        driver,
        { availability: newStatus },
        { new: true }
    );

    return updatedDriver;
}

// ✅ Apply Driver
const applyDriver = async (payload: IDriver) => {
    const session = await Driver.startSession();
    session.startTransaction();

try {
    const { user, licenseNumber, vehicleType, location } = payload;
    // console.log("driver ID ✅:", user);

    // const inputId = payload.id
    // console.log("Input ID 2 ✅:", inputId);

    const currentUser = await User.findById(user).session(session);
    // console.log("currentUser ID 2 ✅:", currentUser);

    if (!currentUser) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Not Found!");
    }
    // condition for match login user === input user
    // if (!(user === inputId)) {
    //     throw new AppError(httpStatus.BAD_REQUEST, "login User & input User is not Match");
    // }  

    const existingDriver = await Driver.findOne({ user }).session(session);
    // console.log("curDriver ID 2 ✅:", existingDriver);
    if (existingDriver) {
        throw new AppError(httpStatus.BAD_REQUEST, "You are already a Driver!!");
    }

    if (currentUser.role === Role.driver) {
        throw new AppError(httpStatus.BAD_REQUEST, "You are already a Driver!");
    }

    if (!licenseNumber || !vehicleType) {
        throw new AppError(httpStatus.BAD_REQUEST, "Missing required fields: licenseNumber and/or vehicleInfo");
    }

    if (!payload.vehicleType?.plateNumber) {
        throw new AppError(httpStatus.BAD_REQUEST, "Plate number is required");
    }
    
    if (!payload.licenseNumber) {
        throw new AppError(httpStatus.BAD_REQUEST, "License number is required");
    }

    // ✅ Create driver 
    const driverDocs = await Driver.create([{
        user: currentUser._id,
        licenseNumber,
        vehicleType, 
        location
    }], { session });

    // ✅ Update role 
    currentUser.role = Role.driver;
    await currentUser.save({ session });

    await session.commitTransaction();
    session.endSession();

    return driverDocs[0];
    } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error; 
    }
};

//✅ accept Ride
const acceptRide = async (id: string, driverId: string) => {
    const session = await Driver.startSession();
    session.startTransaction();

    try {
        // 🔹 Find Driver
        const driver = await Driver.findOne({ user: driverId }).session(session);
            // console.log("driver ID ✅:", driver, id);
        if (!driver) {
            throw new AppError(httpStatus.NOT_FOUND, "Driver not found!");
        }

        const rider = await Ride.findById(id)
        if (!rider) {
            throw new AppError(httpStatus.NOT_FOUND, "Ride Not Found");
        }
        
        if (driver.status !== "approved") {
            throw new AppError(httpStatus.NOT_FOUND, "Driver status cannot approved");
        }
        // console.log("test✅:", driver.activeRide === null)
        if (rider.id ===  driver.activeRide?.toString()) {
            throw new AppError(httpStatus.NOT_FOUND, `You already completed this Ride ${rider.id}`);
        }

        if (driver.activeRide?.toString() === null) {
            throw new AppError(httpStatus.NOT_FOUND, "You are active Ride");
        }

        if (driver.availability !== "online") {
            throw new AppError(httpStatus.BAD_REQUEST, "You must be online to accept ride!");
        
        }
        // important condition
        if (rider.status !== "requested") {
            throw new AppError(httpStatus.NOT_FOUND, "Rider cannot request for Ride");
        }

        // Generate PIN for rider verification
        const pin = Math.floor(1000 + Math.random() * 9000).toString();

        // 🔹 Update Ride with driverId + approved status
        const ride = await Ride.findByIdAndUpdate(
            id,
            {
                $set: {
                driver: driver.id,
                status: "accepted",
                pin: pin,
                "timestamps.accepted": new Date(),
                },
            },
            { new: true }
            );

        if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found!");
        }

        // 🔹 Update Driver availability → busy
        driver.availability = "busy";
        driver.activeRide = rider.id;
        await driver.save({ session });

        await session.commitTransaction();
        session.endSession();

        return ride;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

//✅ accept Ride
const rejectRide = async (id: string, driverId: string) => {
    const session = await Driver.startSession();
    session.startTransaction();

    try {
        // 🔹 Find Driver
        const driver = await Driver.findOne({ user: driverId }).session(session);
            // console.log("driver ID ✅:", driver);
        if (!driver) {
            throw new AppError(httpStatus.NOT_FOUND, "Driver not found!");
        }

        const rider = await Ride.findById(id)
        // console.log("Rider ID ✅:", rider?.rider.toString());
        if (!rider) {
            throw new AppError(httpStatus.NOT_FOUND, "Rider Not Found");
        }
        // console.log("ride function ✅",rider.driver?.toJSON() === driver.id)

        if (rider.driver === driver.id) {
            throw new AppError(httpStatus.FORBIDDEN, "User IDs do not match By your Ride!");
        }

        if (
            rider.status === "cancelled" ||
            rider.status === "in_transit" ||
            rider.status === "no_driver_found"
            ) {
            throw new AppError(httpStatus.BAD_REQUEST, "Cancel is not possible, something went wrong!");
        }

        if (rider.status === "completed") {
            throw new AppError(httpStatus.BAD_REQUEST, "Completed Ride does't possible cancelled!");
        }

        if (rider.status !== "accepted" && rider.status !== "requested" && rider.status !== "picked_up") {
            throw new AppError(httpStatus.BAD_REQUEST, "Ride something wrong");
        } 

        if (['completed', 'in_transit', 'cancelled'].includes(rider.status)) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Ride already cancelled');
        }

        // 🔹 Update Ride 
        const ride = await Ride.findByIdAndUpdate(
            id,
            {
                $set: {
                driver: null,
                status: "requested",
                "timestamps.cancelled": new Date(),
                },
            },
            { new: true }
            );

        if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found!");
        }

        // 🔹 Update Driver
        driver.availability = "online";
        driver.activeRide = null;
        await driver.save({ session });

        await session.commitTransaction();
        session.endSession();

        return ride;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// ✅ Suspend Driver
const suspendDriver = async (id: any) => {

    const driver = await Driver.findById(id)
    if (!driver?._id) {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Found !")
    }

    if (driver.status === "pending" ) {
        throw new AppError(httpStatus.BAD_REQUEST, "Your status: pending, Waiting for Approval.")
    }
    if (driver.status === "rejected") {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver status rejected ⚠️")
    }

    if (driver.availability === "busy") {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver is currently busy and cannot change availability");
    }

    const newStatus =
    driver.status === "approved" ? "suspend" : "approved";

    const updatedDriver = await Driver.findByIdAndUpdate(
        driver,
        { status: newStatus },
        { new: true }
    );

    return updatedDriver;
}

// ✅ Update Ride Status
const updateRideStatus = async (id: string, driver: string, status?: RideStatus) => {
    const transactionId = getTransactionId();

    // const { driverRating, driverFeedback } = rating;

    const session = await Ride.startSession();
    session.startTransaction();

    try {
        const ride = await Ride.findById(id).session(session);
        if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
        }

        const driverDoc = await Driver.findOne({ user: driver }).session(session);
        if (!driverDoc) {
        throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
        }

        // Matching Driver
        if (ride.driver?.toString() !== driverDoc._id.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "This is not your ride");
        }

        let newStatus: RideStatus;

        if (status) {
            // If status is provided, use it
            newStatus = status;
        } else {
            // Otherwise, use the next status from flow
            const nextStatus = statusFlow[ride.status as RideStatus];
            if (!nextStatus) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Cannot update status from ${ride.status}`
                );
            }
            newStatus = nextStatus;
        }

        // Prevent cancellation during transit
        if (ride.status === "in_transit") {
        if (newStatus === "cancelled") {
            throw new AppError(
            httpStatus.BAD_REQUEST,
            "Ride cannot be cancelled during transit"
            );
        }
        }

        ride.status = newStatus;
        const now = new Date();

        switch (newStatus) {
        case "accepted":
            ride.timestamps.driverArrived = now;
            break;

        case "picked_up":
            ride.timestamps.pickedUp = now;
            break;

        case "in_transit":
            ride.timestamps.inTransit = now;
            break;

        case "completed": {
            ride.timestamps.completed = now;

            // calculate duration
            if (ride.timestamps.pickedUp) {
            ride.duration.actual = Math.round(
                (now.getTime() - ride.timestamps.pickedUp.getTime()) /
                (1000 * 60)
            );
            }

            // calculate distance
            if (
            ride.pickupLocation?.coordinates &&
            ride.destinationLocation?.coordinates
            ) {
            ride.distance.actual = calculateDistance(
                ride.pickupLocation.coordinates,
                ride.destinationLocation.coordinates
            );
            }

            // calculate fare
            ride.calculateFare();
            const amount = Math.round(ride.fare.totalFare);

            // 1. Create payment
            const finalTransactionId = ride.paymentMethod === 'cash' ? null : transactionId;
            const payment = await Payment.create(
            [
                {
                rider: ride._id,
                driver: driverDoc._id,
                status: PAYMENT_STATUS.PAID,
                transactionId: finalTransactionId,
                method: ride.paymentMethod || 'cash',
                amount,
                },
            ],
            { session }
            );
            
                // console.log("payment ✅:", payment)

            // 2. 
            const updatedRide = await Ride.findByIdAndUpdate(
            ride._id,
                {
                    payment: payment[0]._id,
                    paymentStatus: RIDE_STATUS.COMPLETE,  //change
                    // rating: {driverRating,
                    // driverFeedback}
                }, 
            { new: true, runValidators: true, session }
            )
            .populate("rider", "name email phone address")
            .populate("driver", "licenseNumber user")
            .populate("payment");

            // 3. 
            const sslPayload: ISSLCommerz = {
            address: (updatedRide?.rider as any).address,
            email: (updatedRide?.rider as any).email,
            phoneNumber: (updatedRide?.rider as any).phone,
            name: (updatedRide?.rider as any).name,
            amount,
            transactionId,
            };

            // 4️.
            await SSLService.sslPaymentInit(sslPayload);

            // 5️.
            if (ride.driver) {
            await Driver.findByIdAndUpdate(
                ride.driver,
                { availability: "online", activeRide: null },
                { session }
            );
            }

            break;
        }
        }

        await ride.save({ session });
        await session.commitTransaction();
        session.endSession();

        return ride;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// ✅ Rating Ride
const ratingRide = async (id: string, riderId: string, rating: number, feedback?: string) => {

    const ride = await Ride.findById(id);
    // console.log("service ✅", id, riderId, rating, feedback)
    if (!ride) {
        throw new Error("Ride not found");
    }
// console.log("Matching Driver: ✅", ride.rider.toString() !== riderId.toString())
    if (ride.rider.toString() === riderId.toString()) {
        throw new Error("You are not authorized to rate this ride");
    }

    if (ride.status !== "completed") {
        throw new Error("You can only rate a completed ride");
    }

    ride.rating = {
        ...ride.rating,
        driverRating: rating,
        driverFeedback: feedback,
    };

    await ride.save();

    return ride;
};

// ✅ Confirm Payment Received
const confirmPaymentReceived = async (id: string, driverId: string) => {
    const ride = await Ride.findById(id).populate('payment');
    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    const driver = await Driver.findOne({ user: driverId });
    if (!driver) {
        throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
    }

    if (ride.driver?.toString() !== driver._id.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "This is not your ride");
    }

    if (ride.status !== "payment_completed") {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment has not been completed yet");
    }

    // Ensure payment status is properly set (may be redundant but added for safety)
    if (!ride.paymentStatus || ride.paymentStatus !== RIDE_STATUS.COMPLETE) {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment status is not complete");
    }

    // Check if there's a payment record and update it if needed
    if (ride.payment) {
        try {
            // For cash payments, ensure they are properly recorded
            if (ride.paymentMethod === 'cash') {
                // Verify the payment has a transaction ID, if not create one
                const payment = await Payment.findById(ride.payment);
                if (payment && !payment.transactionId) {
                    payment.transactionId = `CASH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    await payment.save();
                }
            }
            
            await Payment.findByIdAndUpdate(ride.payment, {
                status: PAYMENT_STATUS.PAID
            });
        } catch {
            // Log but don't fail the process if payment record update fails
        }
    }

    // Update to completed
    ride.status = "completed";
    ride.timestamps.completed = new Date();

    // Set driver availability back to online
    driver.availability = "online";
    driver.activeRide = null;

    await ride.save();
    await driver.save();

    return ride;
};

// ✅ Earning History
const driverEarnings = async (driverUserId: string) => {

    const driverId = await Driver.findOne({user: driverUserId})

    const payments = await Payment.find({ driver: driverId, status: "PAID" })
        .populate("rider", "status duration distance") // optional populate
        .sort({ createdAt: -1 });

    // Total earnings
    const totalEarnings = payments.reduce((acc, p) => acc + p.amount, 0);

    // Today's earnings and completed rides
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPayments = payments.filter(p => p.createdAt && p.createdAt >= today && p.createdAt < tomorrow);
    const todayEarnings = todayPayments.reduce((acc, p) => acc + p.amount, 0);
    const completedToday = todayPayments.length;

    // Calculate average rating from completed rides that have ratings
    const completedRides = await Ride.find({
        driver: driverId,
        status: "completed"
    }).select('rating.riderRating');

    const ratings = completedRides
        .map(ride => ride.rating?.riderRating)
        .filter((rating): rating is number => rating != null && rating > 0);

    // Calculate average from available ratings (don't count rides without ratings)
    const averageRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null;

    return {
        totalEarnings,
        totalTrips: payments.length,
        todayEarnings,
        completedToday,
        averageRating: averageRating !== null ? Math.round(averageRating * 10) / 10 : null, // Round to 1 decimal place or null if not available
        totalCompletedRides: completedRides.length, // Total completed rides for display
        ratedRides: ratings.length, // Number of rides that have ratings
        history: payments.map((p) => ({
        amount: p.amount,
        createdAt: p.createdAt,
        rideId: p.rider,
        transactionId: p.transactionId,
        })),
    };
};

//✅ Update Driver
const updateDriverDoc = async (userId: string, payload: Partial<IDriver>) => {

    const currentDriver = await Driver.findOne({ user: userId });
    if (!currentDriver) throw new Error("Driver not found");

    const updateFields: Partial<IDriver> = {};
        if (payload.licenseNumber !== undefined) updateFields.licenseNumber = payload.licenseNumber;
        if (payload.vehicleType !== undefined) updateFields.vehicleType = payload.vehicleType;
        if (payload.location !== undefined) updateFields.location = payload.location;


    const updatedDriver = await Driver.findByIdAndUpdate(
        currentDriver._id,
        { $set: updateFields },
        { new: true, runValidators: true }
    );

    return updatedDriver;
};

// ✅ Search Driver
const findNearbyDrivers = async (lng: number, lat: number, radiusKm = 5) => {
        const drivers = await Driver.aggregate([
        {
        $addFields: {
            distance: {
            $sqrt: {
                $add: [
                {
                    $pow: [
                    { $subtract: [{ $arrayElemAt: ["$location.coordinates", 0] }, lng] },
                    2,
                    ],
                },
                {
                    $pow: [
                    { $subtract: [{ $arrayElemAt: ["$location.coordinates", 1] }, lat] },
                    2,
                    ],
                },
                ],
            },
            },
        },
        },
        {
        $match: {
            distance: { $lte: radiusKm / 111 }, // ✅ approx conversion (1° ≈ 111km)
            availability: "online",             // ✅ only online drivers
        },
        },
        {
        $lookup: {
            from: "users",             // user collection
            localField: "user",        
            foreignField: "_id",
            as: "userInfo",
        },
        },
        { $unwind: "$userInfo" },
        {
        $project: {
            _id: 1,
            licenseNumber: 1,
            vehicleType: 1,
            location: 1,
            distance: 1,
            name: "$userInfo.name",
            phone: "$userInfo.phone"    
        },
        },
    ]);

    return drivers;
};

// ✅ Verify PIN and start ride
const verifyPin = async (id: string, pin: string, driverId: string) => {
    const ride = await Ride.findById(id);
    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    const driver = await Driver.findOne({ user: driverId });
    if (!driver) {
        throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
    }

    if (ride.driver?.toString() !== driver._id.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "This is not your ride");
    }

    if (ride.status !== "picked_up") {
        throw new AppError(httpStatus.BAD_REQUEST, "Ride is not in picked_up status");
    }

    if (ride.pin !== pin) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid PIN");
    }

    // Update to in_transit
    ride.status = "in_transit";
    ride.timestamps.inTransit = new Date();
    await ride.save();

    return ride;
};






export const DriverService = {
    getDriverDetails,
    setOnlineOffline,
    approvedDriver,
    acceptRide,
    applyDriver,
    rejectRide,
    suspendDriver,
    updateRideStatus,
    verifyPin,
    ratingRide,
    driverEarnings,
    findNearbyDrivers,
    updateDriverDoc,
    confirmPaymentReceived,

};
