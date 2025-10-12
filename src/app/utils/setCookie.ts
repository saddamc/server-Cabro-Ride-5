import { Response } from "express";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
  // Check if we're in production (Vercel deployment)
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  console.log("Setting cookies - NODE_ENV:", process.env.NODE_ENV, "VERCEL:", process.env.VERCEL, "isProduction:", isProduction);

  const cookieOptions = {
    httpOnly: true,
    secure: true, // Always secure for HTTPS
    sameSite: "none" as const, // Required for cross-site on Vercel
    domain: isProduction ? ".ride-5.vercel.app" : undefined,
  };

  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, cookieOptions);
  }

  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, cookieOptions);
  }
};




// export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
//   console.log("Setting cookies - NODE_ENV:", envVars.NODE_ENV);
//   const cookieOptions = {
//     httpOnly: true,
//     secure: true,
//     sameSite: "none"  as const,
//     domain: ".ride-5.vercel.app"
//   };
//   if (tokenInfo.accessToken) {
//     res.cookie("accessToken", tokenInfo.accessToken, cookieOptions);
//   }

//   if (tokenInfo.refreshToken) {
//     res.cookie("refreshToken", tokenInfo.refreshToken, cookieOptions);
//   }
// };

