/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Ride } from "../rider/rider.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { Payment } from "./payment.model";


// ✅ Payment init
const initPayment = async (id: string) => {

    const payment = await Payment.findOne({ id: id })
    // console.log("payment ✅:", payment)

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment Not Found. You have not booked this tour")
    }

    const booking = await Ride.findById(payment.rider)
    // console.log("payment ✅:", payment)

    const userAddress = (booking?.rider as any).address
    const userEmail = (booking?.rider as any).email
    const userPhoneNumber = (booking?.rider as any).phone
    const userName = (booking?.rider as any).name

    const sslPayload: ISSLCommerz = {
        address: userAddress,
        email: userEmail,
        phoneNumber: userPhoneNumber,
        name: userName,
        amount: payment.amount,
        transactionId: payment.transactionId
    }

    const sslPayment = await SSLService.sslPaymentInit(sslPayload)

    return {
        paymentUrl: sslPayment.GatewayPageURL
    }

};




export const PaymentService = {
    initPayment,
};