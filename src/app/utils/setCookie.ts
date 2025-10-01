// import { Response } from "express";

// export interface AuthTokens {
//   accessToken?: string;
//   refreshToken?: string;
// }

// export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
//   console.log("Setting auth cookies:", tokenInfo); // Debug log
//   if (tokenInfo.accessToken) {
//     res.cookie("accessToken", tokenInfo.accessToken, {
//       httpOnly: true,
//       secure: false,
//     });
//   }

//   if (tokenInfo.refreshToken) {
//     res.cookie("refreshToken", tokenInfo.refreshToken, {
//       httpOnly: true,
//       secure: false,
//     });
//   }
// };


// ! new Version modified
import { Response } from "express";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
  // Access Token Cookie (short-lived)
  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
     // maxAge: 60 * 60 * 1000, // 60 minutes
    });
  }

  // Refresh Token Cookie (longer-lived)
  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      //maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
};

