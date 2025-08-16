import httpStatus from 'http-status-codes';

// import httpStatus from "http-status";
// import AppError from "../../errorHelpers/AppError";
// import { Role } from "../user/user.interface";
// import { User } from "../user/user.model";
// import { IDriver } from "./driver.interface";

import AppError from "../../errorHelpers/AppError";
import { AuthRequest } from '../auth/auth.interface';
import { Ride } from '../rider/rider.model';
import { Driver } from "./driver.model";

// ✅ Driver Status 
const setOnlineOffline = async (id: string) => {

    const driver = await Driver.findOne({ _id: id })
    if (!driver) {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver Not Found !")
    }

    if (driver.status === "pending" || driver.status === "rejected" || driver.status === "suspended") {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver status can't approved !")
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

// accept Ride 
const acceptRide = async (req: AuthRequest, res: Response): Promise<void> => {

    const { id } = req.params;
    const driver = await Driver.findOne({ user: req.user?._id });
    
    if (!driver) {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver profile not found !")
    }

    if (driver.availability !== "online") {
        throw new AppError(httpStatus.BAD_REQUEST, "DDriver must be online to accept rides !")
    }

    if (driver.activeRide) {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver already has an active ride !")
    }

    const ride = await Ride.findById(id)
    if (!ride) {
        throw new AppError(httpStatus.BAD_REQUEST, "Ride not found !")
    }

    if (ride.status !== "requested") {
        throw new AppError(httpStatus.BAD_REQUEST, "Ride is no longer available !")
    }

    // accept the ride
    ride.driverId = driver.id
    await ride.updateStatus("accepted")


    

}


export const DriverService = {
    setOnlineOffline
};
