import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

export const validateRequest =
  (zodSchema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // console.log("old body", req.body);
      if (req.body.data) {
        req.body = zodSchema.parseAsync(req.body);
      }
      // console.log("new body", req.body);
      next();
    } catch (error) {
      next(error);
    }
  };


// ! new version 
// import { NextFunction, Request, Response } from "express";
// import { ZodTypeAny } from "zod";

// export const validateRequest =
//   (zodSchema: ZodTypeAny) =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//      const parsed = await zodSchema.parseAsync(req.body.data ?? req.body);
//       req.body = parsed; // replace with validated data
//       next();
//     } catch (error) {
//       next(error);
//     }
//   };
