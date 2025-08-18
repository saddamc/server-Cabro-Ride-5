/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status-codes';
import AppError from "../../errorHelpers/AppError";
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
const setOnlineOffline = async (id: string) => {

    const driver = await Driver.findOne({ _id: id })
    if (!driver) {
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
        id,
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

        if (driver.status === "approved") {
            throw new AppError(httpStatus.NOT_FOUND, `You active in Ride !: ${rider.id}`);
        }

        if (driver.activeRide?._id) {
            throw new AppError(httpStatus.NOT_FOUND, `You active in Ride: ${rider.id}`);
        }

        if (driver.availability !== "online") {
        throw new AppError(httpStatus.BAD_REQUEST, "You must be online to accept a ride!");
        }

        // 🔹 Update Ride with driverId + approved status
        const ride = await Ride.findByIdAndUpdate(
        id,
        {
            driver: driverId,
            status: "accepted",
        },
        { new: true, session }
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




export const DriverService = {
    setOnlineOffline,
    approvedDriver,
    acceptRide,
    applyDriver,
};
