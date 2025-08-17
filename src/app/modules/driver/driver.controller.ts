 
import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { IDriver } from './driver.interface';
import { DriverService } from './driver.service';


// ✅ Approval Driver status
const approvedDriver = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await DriverService.approvedDriver(id)
    // console.log("set Online✅:", result)

        sendResponse(res, {
        statusCode: 201,
        success: true,
        message:` Driver available: 👀 ${result?.status}`,
        data: result,
        });
})

// ✅ applyDriver
const applyDriver = catchAsync(async (req: Request, res: Response) => {
const userFromToken = req.user as JwtPayload; 
    
    const payload: IDriver = {
        ...req.body,
        user: userFromToken.userId,
    };

    const result = await DriverService.applyDriver(payload);
    

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Driver application submitted successfully",
        data: result,
    });
})

// ✅ online Driver status
const setOnlineOffline = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await DriverService.setOnlineOffline(id)

        sendResponse(res, {
        statusCode: 201,
        success: true,
        message:` Driver available: 👀 ${result?.availability}`,
        data: result,
        });
})

export const DriverController = {
    setOnlineOffline,
    approvedDriver,
    applyDriver
};