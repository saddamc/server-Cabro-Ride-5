/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { TErrorSources, TGenericErrorResoponse } from "../interfaces/errorTypes";

export const handleValidationError = (err: mongoose.Error.ValidationError):TGenericErrorResoponse => {
  const errorSources: TErrorSources[] = [];

  const errors = Object.values(err.errors);

  errors.forEach((errorObject: any) =>
    errorSources.push({
      path: errorObject.path,
      message: errorObject.message,
    })
  );
  // console.log(errorSources)

  return {
    statusCode: 409,
    message: `Validation error: ${err.message}`,
    errorSources,
  };
};