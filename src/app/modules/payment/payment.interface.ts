/* eslint-disable @typescript-eslint/no-explicit-any */
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
    ride: Types.ObjectId; // Reference to the ride
    driver: Types.ObjectId; // Reference to the driver
    transactionId: string;
    amount: number; 
    paymentGatewayData?: any;
    invoiceUrl ?: string;
    status: PAYMENT_STATUS; 
    createdAt?: Date;
}