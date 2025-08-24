/* eslint-disable @typescript-eslint/no-explicit-any */
import { TErrorSources, TGenericErrorResoponse } from "../interfaces/errorTypes";

export const handleZodError = (err: any): TGenericErrorResoponse => {
  const errorSources: TErrorSources[] = [];

    // console.log(err.issues);
    err.issues.forEach((issue: any) => {
      errorSources.push({
        path: issue.path[issue.path.length - 1],
        message: issue.message,
      });
    });
  return {
    statusCode: 409,
    message: "Zod validation failed",
    errorSources

  }
}