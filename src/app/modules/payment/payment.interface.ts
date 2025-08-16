
import { Types } from "mongoose";

export type PaymentType = "ride_payment" | "payout" | "refund" | "bonus" | "other";

export enum PAYMENT_STATUS {
    PAID = "PAID",
    UNPAID = "UNPAID",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}

export interface IPayment {
    _id: Types.ObjectId;
    ride: Types.ObjectId; // Reference to the ride
    driver: Types.ObjectId; // Reference to the driver
    amount: number; // Amount in cents or smallest currency unit
    type: PaymentType; // Type of transaction
    status: PAYMENT_STATUS; // Status of the payment
    createdAt: Date; // Timestamp of transaction creation
}