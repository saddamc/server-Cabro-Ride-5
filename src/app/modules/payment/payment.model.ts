import { model, Schema } from "mongoose";
import { IPayment, PAYMENT_STATUS } from "../payment/payment.interface";



const paymentSchema = new Schema<IPayment>({
    ride: {
        type: Schema.Types.ObjectId,
        ref: "Rider",
        required: true,
    },
    driver: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ["ride_payment", "payout", "refund", "bonus", "other"],
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.UNPAID,
    },
}, {
    timestamps: true
})

export const Payment = model<IPayment>("Payment", paymentSchema)