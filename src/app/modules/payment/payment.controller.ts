import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

// ✅ 
const initPayment = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await PaymentService.initPayment(id)
    // console.log("payment ✅:", id)
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Payment done successfully",
        data: result,
    });
});



export const PaymentController = {
    initPayment,
};