/* eslint-disable @typescript-eslint/no-explicit-any */
import bcryptjs from "bcryptjs";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback, } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { envVars } from "./env";

// 29-01
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
          const isUserExist = await User.findOne({ email });
          
        // if (!isUserExist) {
        //   return done(null, false, { message: "User does not exist" });
        //   }
          
        if (!isUserExist) {
              return done("User does not exist!")
          }
          
        const isGoogleAuthenticated = isUserExist.auths.some(providerObjects => providerObjects.provider == "google")
        

        if (isGoogleAuthenticated && !isUserExist.password) {
              return done(null, false, {message: "You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for you Gmail and then you can login with email and password"}) // error from !user
        }

        const isPasswordMatched = await bcryptjs.compare(
          password as string,
          isUserExist.password as string
        );

        if (!isPasswordMatched) {
          return done(null, false, { message: "Password does not match" });
        }
          
        return done(null, isUserExist)

      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURL: envVars.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(null, false, { message: "No email found" });
        }

      let user = await User.findOne({ email });

        if (!user) {
          // create new user
          user = await User.create({
            email,
            name: profile.displayName,
            profilePicture: profile.photos?.[0]?.value || null,
            role: Role.rider,
            isVerified: true,
            auths: [
              {
                provider: "google",
                providerId: profile.id,
              },
            ],
          });
        } else {
          // update existing user profile picture if missing
          if (!user.profilePicture && profile.photos?.[0]?.value) {
            user.profilePicture = profile.photos[0].value;
            await user.save();
          }
        }

        console.log("Google profile object:", JSON.stringify(profile, null, 2));

        return done(null, user);
      } catch (error) {
        // console.log("Google Strategy Error", error);
        return done(error);
      }
    }
  )
);


passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.log(error);
    done(error);
  }
});





//! new version modified 20-09
 
// import bcryptjs from "bcryptjs";
// import passport from "passport";
// import {
//   Strategy as GoogleStrategy,
//   Profile,
//   VerifyCallback,
// } from "passport-google-oauth20";
// import { Strategy as LocalStrategy } from "passport-local";
// import { Role } from "../modules/user/user.interface";
// import { User } from "../modules/user/user.model";
// import { envVars } from "./env";

// // ==========================
// // Local Strategy (email/password)
// // ==========================
// passport.use(
//   new LocalStrategy(
//     { usernameField: "email", passwordField: "password" },
//     async (email, password, done) => {
//       try {
//         const user = await User.findOne({ email });

//         if (!user) {
//           return done(null, false, { message: "User does not exist" });
//         }

//         const isGoogleAuthenticated = user.auths.some(
//           (provider) => provider.provider === "google"
//         );

//         if (isGoogleAuthenticated && !user.password) {
//           return done(null, false, {
//             message:
//               "You signed up with Google. Please login with Google first and set a password.",
//           });
//         }

//         const isPasswordMatched = await bcryptjs.compare(
//           password,
//           user.password as string
//         );

//         if (!isPasswordMatched) {
//           return done(null, false, { message: "Password does not match" });
//         }

//         return done(null, user);
//       } catch (error) {
//         return done(error);
//       }
//     }
//   )
// );

// // ==========================
// // Google OAuth Strategy
// // ==========================
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: envVars.GOOGLE_CLIENT_ID,
//       clientSecret: envVars.GOOGLE_CLIENT_SECRET,
//       callbackURL: envVars.GOOGLE_CALLBACK_URL,
//     },
//     async (
//       accessToken: string,
//       refreshToken: string,
//       profile: Profile,
//       done: VerifyCallback
//     ) => {
//       try {
//         const email = profile.emails?.[0].value;
//         if (!email) {
//           return done(null, false, { message: "No email found in Google profile" });
//         }

//         let user = await User.findOne({ email });

//         if (!user) {
//           // Create new user
//           user = await User.create({
//             email,
//             name: profile.displayName,
//             profilePicture: profile.photos?.[0]?.value || null,
//             role: Role.rider, // default role
//             isVerified: true,
//             auths: [
//               {
//                 provider: "google",
//                 providerId: profile.id,
//               },
//             ],
//           });
//         } else {
//           // Update missing info if needed
//           let updated = false;

//           if (!user.profilePicture && profile.photos?.[0]?.value) {
//             user.profilePicture = profile.photos[0].value;
//             updated = true;
//           }

//           const alreadyLinked = user.auths.some(
//             (auth) => auth.provider === "google"
//           );

//           if (!alreadyLinked) {
//             user.auths.push({
//               provider: "google",
//               providerId: profile.id,
//             });
//             updated = true;
//           }

//           if (updated) {
//             await user.save();
//           }
//         }

//         return done(null, user);
//       } catch (error) {
//         return done(error);
//       }
//     }
//   )
// );

// // ==========================
// // NOTE: Since we’re using JWT, we don’t need
// // serializeUser / deserializeUser or express-session
// // ==========================

// export default passport;






