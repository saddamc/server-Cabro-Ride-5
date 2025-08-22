import { model, Schema } from "mongoose";
import { IPayment, PAYMENT_STATUS } from "../payment/payment.interface";



const paymentSchema = new Schema<IPayment>({
    ride: {
        type: Schema.Types.ObjectId,
        ref: "Ride",
        required: true,
    },
    driver: {
        type: Schema.Types.ObjectId,
        ref: "Driver", required: true,
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.UNPAID
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentGatewayData: {
        type: Schema.Types.Mixed
    },
    invoiceUrl: {
        type: String
    }
}, {
    timestamps: true
})

export const Payment = model<IPayment>("Payment", paymentSchema)