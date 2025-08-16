import { Request } from "express";
import { IDriver } from "../driver/driver.interface";
import { IUser } from "../user/user.interface";

export interface AuthRequest extends Request {
    user?: IUser;
    driver?: IDriver;
}

export interface JWTPayload {
    id: string;
    iat?: number;
    exp?: number;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: IUser;
        token: string;
        driverStatus?: string;
        driverApproved?: boolean;
    };
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    data: {
        user: IUser;
        token: string;
    };
}