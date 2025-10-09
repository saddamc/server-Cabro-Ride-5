import { Response } from "express";
import { envVars } from "../config/env";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

// export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
//   console.log("NODE_ENV:", envVars.NODE_ENV); // Debug log
//   if (tokenInfo.accessToken) {
//     res.cookie("accessToken", tokenInfo.accessToken, {
//       httpOnly: true,
//       secure: true, // true in production, false in development
//       sameSite: "none",
//     });
//   }

//   if (tokenInfo.refreshToken) {
//     res.cookie("refreshToken", tokenInfo.refreshToken, {
//       httpOnly: true,
//       secure: true, // true in production, false in development
//       sameSite: "none",
//     });
//   }
// };




export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
  console.log("Setting cookies - NODE_ENV:", envVars.NODE_ENV);
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none"  as const,
    domain: "ride-5.vercel.app"
  };
  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, cookieOptions);
  }

  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, cookieOptions);
  }
};

// ! new Version modified
// import { Response } from "express";
// import { envVars } from "../config/env";

// export interface AuthTokens {
//   accessToken?: string;
//   refreshToken?: string;
// }

// export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
//   // Access Token Cookie (short-lived)
//   if (tokenInfo.accessToken) {
//     res.cookie("accessToken", tokenInfo.accessToken, {
//       httpOnly: true,
//       secure: envVars.NODE_ENV === "production", // true in production
//       sameSite: "none",
//      // maxAge: 60 * 60 * 1000, // 60 minutes
//     });
//   }

//   // Refresh Token Cookie (longer-lived)
//   if (tokenInfo.refreshToken) {
//     res.cookie("refreshToken", tokenInfo.refreshToken, {
//       httpOnly: true,
//       secure: envVars.NODE_ENV === "production", // true in production
//       sameSite: "none",
//       //maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });
//   }
// };

