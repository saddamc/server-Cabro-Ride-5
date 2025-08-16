/* eslint-disable @typescript-eslint/no-explicit-any */
import { TGenericErrorResoponse } from "../interfaces/errorTypes";

export const handleDuplicateError = (err: any): TGenericErrorResoponse => {
  const duplicateKey = Object.keys(err.keyValue)[0];
  // const duplicate = err.message.match(/"([^"]*)"/)
  const duplicate = err.keyValue[duplicateKey];
  return {
    statusCode: 409,
    message: `${duplicateKey} ${duplicate} already exists`,
  };
};