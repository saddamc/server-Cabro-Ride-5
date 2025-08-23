 
import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from './admin.service';


const getAnalytics = async (req: Request, res: Response) => {

    const result = await AdminService.getAnalytics();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Analytics successfully",
        data: result
    });
}

export const AdminController = {
    getAnalytics
}
