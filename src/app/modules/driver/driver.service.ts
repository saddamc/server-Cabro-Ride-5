/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status-codes';
import AppError from "../../errorHelpers/AppError";
import { RideStatus, statusFlow } from '../rider/rider.interface';
import { Ride } from '../rider/rider.model';
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

    const driver = await Driver.findOne({ userId: id?.userId })
    // console.log("who:", driver?._id.toString())
    // console.log(JSON.stringify(driver?._id, null, 2));
    if (!driver?._id) {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Found !")
    }

    if (driver.status === "pending" ) {
        throw new AppError(httpStatus.BAD_REQUEST, "Your status: pending, Waiting for Approval.")
    }
    if (driver.status === "rejected" || driver.status === "suspended") {
        throw new AppError(httpStatus.BAD_REQUEST, "Update your documents or contact customer support. ⚠️")
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
    const { user, licenseNumber, vehicleType } = payload;
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
        vehicleType
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
            // console.log("driver ID ✅:", driver);
        if (!driver) {
            throw new AppError(httpStatus.NOT_FOUND, "Driver not found!");
        }

        const rider = await Ride.findById(id)
        if (!rider) {
            throw new AppError(httpStatus.NOT_FOUND, "Rider Not Found");
        }

        if (driver.status === "pending") {
            throw new AppError(httpStatus.NOT_FOUND, "Wait for confirm your application");
        }

        if (rider.id === id) {
            throw new AppError(httpStatus.NOT_FOUND, "You already active in this Ride");
        }

        if (driver.activeRide === null) {
            throw new AppError(httpStatus.NOT_FOUND, `You active in Ride: ${rider.id}`);
        }

        if (driver.availability !== "online") {
        throw new AppError(httpStatus.BAD_REQUEST, "You must be online to accept ride!");
        }

        // 🔹 Update Ride with driverId + approved status
        const ride = await Ride.findByIdAndUpdate(
            id,
            {
                $set: {
                driver: driver.id,
                status: "driver_arrived",
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
            throw new AppError(httpStatus.FORBIDDEN, "User IDs do not match!");
        }

        if (
            rider.status === "accepted" ||
            rider.status === "in_transit" ||
            rider.status === "no_driver_found"
            ) {
            throw new AppError(httpStatus.BAD_REQUEST, "Cancel is not possible, something went wrong!");
        }

        if (rider.status === "completed") {
            throw new AppError(httpStatus.BAD_REQUEST, "Completed Ride does't possible cancelled!");
        }

        if (rider.status === "requested") {
            throw new AppError(httpStatus.BAD_REQUEST, "This ride is requested for accepted!");
        } 
        if (rider.status === "picked_up") {
            throw new AppError(httpStatus.BAD_REQUEST, "Driver on the way to Destination!");
        }


        if (['completed', 'pick_up', 'in_transit', 'cancelled'].includes(rider.status)) {
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


const pickupRide = async (id: string, driver: string) => {
    const ride = await Ride.findById(id);
    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    const driverId = await Driver.findOne({user: driver})
    //  console.log("driverId ✅:", driverId)

    // Matching Driver
    if (ride.driver?.toString() !== driverId?._id.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "This is not your ride");
    }

    const nextStatus = statusFlow[ride.status as RideStatus];
    if (!nextStatus) {
        throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot update status from ${ride.status}`
        );
    }

    // Prevent cancellation after picked_up
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
        case "driver_arrived":
        ride.timestamps.driverArrived = now;
        break;
        case "picked_up":
        ride.timestamps.pickedUp = now;
        break;
        case "in_transit":
        break;
        case "completed":
        ride.timestamps.completed = now;
        if (ride.timestamps.pickedUp) {
            ride.duration.actual = Math.round(
            (now.getTime() - ride.timestamps.pickedUp.getTime()) / (1000 * 60)
            );
        }
        break;
    }

    await ride.save();
    return ride;
};

const completeRide = async (id: string, driver: string) => {
    const ride = await Ride.findById(id);
    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    const driverId = await Driver.findOne({user: driver})
    //  console.log("driverId ✅:", driverId)

    // Matching Driver
    if (ride.driver?.toString() !== driverId?._id.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "This is not your ride");
    }

    const nextStatus = statusFlow[ride.status as RideStatus];
    if (!nextStatus) {
        throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot update status from ${ride.status}`
        );
    }

    // Prevent cancellation after picked_up
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
        case "driver_arrived":
        ride.timestamps.driverArrived = now;
        break;
        case "picked_up":
        ride.timestamps.pickedUp = now;
        break;
        case "in_transit":
        break;
        case "completed":
        ride.timestamps.completed = now;
        if (ride.timestamps.pickedUp) {
            ride.duration.actual = Math.round(
            (now.getTime() - ride.timestamps.pickedUp.getTime()) / (1000 * 60)
            );
        }
        break;
    }

    await ride.save();
    return ride;
};



export const DriverService = {
    setOnlineOffline,
    approvedDriver,
    acceptRide,
    applyDriver,
    rejectRide,
    pickupRide,
    completeRide,
};
