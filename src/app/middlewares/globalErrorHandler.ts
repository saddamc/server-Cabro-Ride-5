/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { handleCastError } from "../helpers/handleCastError";
import { handleDuplicateError } from "../helpers/handleDuplicateError";
import { handleValidationError } from "../helpers/handleValidationError";
import { handleZodError } from "../helpers/handleZodError";
import { TErrorSources } from "../interfaces/errorTypes";

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

  if (envVars.NODE_ENV === "development") {
    console.log(err)
  }

  /*** 29-06-B */  /** (correction)=> 29-08- */
  let errorSources: TErrorSources[] = [
  ];

  let statusCode = 500; //2 const to let
  let message = "Something Went Wrong!!"; //2 delete {err.message}

  // duplicate error  /** (correction)=> 29-08- */
  if (err.code === 11000) {
    // console.log("Deplicate Error global:", err.message)
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }
  // cast error / ObjectId error /** (correction)=> 29-08- */
  else if (err.name === "CastError") {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }
  // zod error  /** (correction)=> 29-08- */
  else if (err.name === "ZodError") {
    const simplifiedError = handleZodError(err)
        statusCode = simplifiedError.statusCode
        message = simplifiedError.message
        errorSources = simplifiedError.errorSources as TErrorSources[]
  }

  // Mongoose ValidatorError /**29-06-A */  /** (correction)=> 29-08- */
  else if (err.name === "ValidationError") {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    errorSources = simplifiedError.errorSources as TErrorSources[];
    message = simplifiedError.message;
  }

  //2 full code
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources, //29-06-C
    err : envVars.NODE_ENV === "development" ? err : null,
    stack: envVars.NODE_ENV === "development" ? err.stack : null,
  });
};

export default globalErrorHandler;
