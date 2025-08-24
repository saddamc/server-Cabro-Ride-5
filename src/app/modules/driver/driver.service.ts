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

        // 🔹 Update Ride with driverId + approved status
        const ride = await Ride.findByIdAndUpdate(
            id,
            {
                $set: {
                driver: driver.id,
                status: "accepted",
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

        if (rider.status !== "accepted" && rider.status !== "requested") {
            throw new AppError(httpStatus.BAD_REQUEST, "Ride something wrong");
        } 

        if (['completed', 'picked_up', 'in_transit', 'cancelled'].includes(rider.status)) {
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
const updateRideStatus = async (id: string, driver: string,) => {
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

        const nextStatus = statusFlow[ride.status as RideStatus];
        if (!nextStatus) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Cannot update status from ${ride.status}`
        );
        }

        // Prevent cancellation after pickup
        if (ride.status === "picked_up" || ride.status === "in_transit") {
        if (nextStatus === "cancelled") {
            throw new AppError(
            httpStatus.BAD_REQUEST,
            "Ride cannot be cancelled after pickup"
            );
        }
        }

        ride.status = nextStatus;
        const now = new Date();

        switch (nextStatus) {
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
            const payment = await Payment.create(
            [
                {
                rider: ride._id,
                driver: driverDoc._id,
                status: PAYMENT_STATUS.PAID,  //change when add payment system 
                transactionId,
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

// ✅ Earning History 
const driverEarnings = async (driverUserId: string) => {

    const driverId = await Driver.findOne({user: driverUserId})

    const payments = await Payment.find({ driver: driverId, status: "PAID" })
        .populate("rider", "status duration distance") // optional populate
        .sort({ createdAt: -1 });

    // Total earnings
    const totalEarnings = payments.reduce((acc, p) => acc + p.amount, 0);

    return {
        totalEarnings,
        totalTrips: payments.length,
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






export const DriverService = {
    setOnlineOffline,
    approvedDriver,
    acceptRide,
    applyDriver,
    rejectRide,
    suspendDriver,
    updateRideStatus,
    ratingRide,
    driverEarnings,
    findNearbyDrivers,
    updateDriverDoc,

};
