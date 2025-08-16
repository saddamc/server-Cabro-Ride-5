import mongoose from "mongoose";
import { TGenericErrorResoponse } from "../interfaces/errorTypes";

export const handleCastError = (err: mongoose.Error.CastError):TGenericErrorResoponse => {
  return {
    statusCode: 409,
    // message : "Invalid MongoDB ObjectId. Please provide a valid id";
    message: `Invalid ${err.path}: ${err.value}. Please provide a valid id`,
  };
};