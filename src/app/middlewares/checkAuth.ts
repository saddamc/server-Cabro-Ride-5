import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IsActive } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { verifyToken } from "../utils/jwt";


// // ✅ checkAuth
// export const checkAuth =
//   (...authRoles: string[]) =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const accessToken = req.headers.authorization;

//       if (!accessToken) {
//         throw new AppError(403, "No Token Received 🧑‍💻");
//       }

//       // const verifiedToken = jwt.verify(accessToken, "secret");
//       const verifiedToken = verifyToken(
//         accessToken,
//         envVars.JWT_ACCESS_SECRET
//       ) as JwtPayload;

 
//       const isUserExist = await User.findOne({ email: verifiedToken.email });

//       if (!isUserExist) {
//         throw new AppError(httpStatus.UNAUTHORIZED, "User does not Exist 🧑‍💻");
//       }

//       if (
//         isUserExist.isActive === IsActive.BLOCKED ||
//         isUserExist.isActive === IsActive.INACTIVE
//       ) {
//         throw new AppError(
//           httpStatus.BAD_REQUEST,
//           `User is ${isUserExist.isActive} 🧑‍💻`
//         );
//       }

//       if (isUserExist.isDeleted) {
//         throw new AppError(httpStatus.BAD_REQUEST, "User is deleted 🧑‍💻");
//       }

//       if (!isUserExist.isVerified) {
//         throw new AppError(httpStatus.BAD_REQUEST, "User is not verified 🧑‍💻");
//       }
// // console.log("auth✅:", (verifiedToken.role))
//       if (!authRoles.includes(verifiedToken.role)) {
//         throw new AppError(403, "You are not permitted to view this route 🧑‍💻");
//       }

//       req.user = verifiedToken;
//       next();
//     } catch (error) {
//       console.log("jwt error 🧑‍💻", error);
//       next(error);
//     }
//   };



// ! new version modified 
export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Try from cookie
      let token = req.cookies?.accessToken;

      // 2. If not in cookie, check Authorization header
      if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, "No token received 🧑‍💻");
      }

      const verifiedToken = verifyToken(
        token,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

      if (!verifiedToken?.email) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token 🧑‍💻");
      }

      const isUserExist = await User.findOne({ email: verifiedToken.email });
      if (!isUserExist) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist 🧑‍💻");
      }

      if (
        isUserExist.isActive === IsActive.BLOCKED ||
        isUserExist.isActive === IsActive.INACTIVE
      ) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          `User is ${isUserExist.isActive} 🧑‍💻`
        );
      }

      if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.FORBIDDEN, "User is deleted 🧑‍💻");
      }

      if (!isUserExist.isVerified) {
        throw new AppError(httpStatus.FORBIDDEN, "User is not verified 🧑‍💻");
      }

      // Role-based check
      if (authRoles.length > 0 && !authRoles.includes(verifiedToken.role)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You are not permitted to view this route 🧑‍💻"
        );
      }

      req.user = verifiedToken;
      next();
    } catch (error) {
      console.error("JWT Auth error 🧑‍💻", error);
      next(error);
    }
  };
