import { Request, Response } from 'express';
import { sendResponse } from '../../utils/sendResponse';
import { DriverService } from './driver.service';

// import { Request, Response } from "express";
// import httpStatus from "http-status-codes";
// import { catchAsync } from "../../utils/catchAsync";
// import { sendResponse } from "../../utils/sendResponse";
// import { IUser } from "../user/user.interface";

// ✅ online Driver status
const setOnlineOffline = async (req: Request, res: Response) => {
    const {id} = req.params
 
    const result = await DriverService.setOnlineOffline(id)

        sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Driver application submitted successfully",
        data: result,
        });
}

export const DriverController = {
    setOnlineOffline
};