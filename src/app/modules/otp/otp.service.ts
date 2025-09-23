// import crypto from "crypto";
// import { redisClient } from "../../config/redis.config";
// import AppError from "../../errorHelpers/AppError";
// import { sendEmail } from "../../utils/sendEmail";
// import { User } from "../user/user.model";

// const OTP_EXPIRATION = 2 * 60; // 2 minutes

// // In-memory OTP store as a fallback when Redis is unavailable
// const memoryOtpStore = new Map<string, { otp: string, expiresAt: number }>();

// // Helper function to check if Redis is available
// const isRedisAvailable = () => {
//     return redisClient.isOpen;
// };

// // Helper to store OTP either in Redis or memory
// const storeOtp = async (email: string, otp: string, expirationSeconds: number) => {
//     const redisKey = `otp:${email}`;
    
//     try {
//         if (isRedisAvailable()) {
//             // Store in Redis if available
//             await redisClient.set(redisKey, otp, {
//                 expiration: {
//                     type: "EX",
//                     value: expirationSeconds
//                 }
//             });
//             return true;
//         }
//     } catch (error) {
//         console.error("Redis error when storing OTP:", error);
//     }
    
//     // Fallback to memory storage
//     const expiresAt = Date.now() + (expirationSeconds * 1000);
//     memoryOtpStore.set(redisKey, { otp, expiresAt });
    
//     // Set up expiration for memory storage
//     setTimeout(() => {
//         memoryOtpStore.delete(redisKey);
//     }, expirationSeconds * 1000);
    
//     return false;
// };

// // Helper to retrieve OTP either from Redis or memory
// const getOtp = async (email: string): Promise<string | null> => {
//     const redisKey = `otp:${email}`;
    
//     try {
//         if (isRedisAvailable()) {
//             // Try Redis first
//             return await redisClient.get(redisKey);
//         }
//     } catch (error) {
//         console.error("Redis error when retrieving OTP:", error);
//     }
    
//     // Fallback to memory storage
//     const memoryEntry = memoryOtpStore.get(redisKey);
//     if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
//         return memoryEntry.otp;
//     }
    
//     // Clean up expired entry if it exists
//     if (memoryEntry) {
//         memoryOtpStore.delete(redisKey);
//     }
    
//     return null;
// };

// // Helper to delete OTP from both Redis and memory
// const deleteOtp = async (email: string) => {
//     const redisKey = `otp:${email}`;
    
//     try {
//         if (isRedisAvailable()) {
//             await redisClient.del([redisKey]);
//         }
//     } catch (error) {
//         console.error("Redis error when deleting OTP:", error);
//     }
    
//     // Always clean up memory storage
//     memoryOtpStore.delete(redisKey);
// };

// const generateOtp = (length = 6) => {
//     //6 digit otp
//     const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
//     return otp;
// };

// const sendOTP = async (email: string, name: string) => {
//     const user = await User.findOne({ email });

//     if (!user) {
//         throw new AppError(404, "User not found");
//     }

//     if (user.isVerified) {
//         throw new AppError(401, "You are already verified");
//     }
    
//     const otp = generateOtp();
    
//     // Store OTP with fallback mechanism
//     await storeOtp(email, otp, OTP_EXPIRATION);

//     // Send email with OTP
//     await sendEmail({
//         to: email,
//         subject: "Your OTP Code",
//         templateName: "otp",
//         templateData: {
//             name: name,
//             otp: otp
//         }
//     });
// };

// const verifyOTP = async (email: string, otp: string) => {
//     const user = await User.findOne({ email });

//     if (!user) {
//         throw new AppError(404, "User not found");
//     }

//     if (user.isVerified) {
//         throw new AppError(401, "You are already verified");
//     }

//     // Get OTP with fallback mechanism
//     const savedOtp = await getOtp(email);

//     if (!savedOtp) {
//         throw new AppError(401, "Invalid or expired OTP");
//     }

//     if (savedOtp !== otp) {
//         throw new AppError(401, "Invalid OTP");
//     }

//     // Update user and clean up OTP
//     await Promise.all([
//         User.updateOne({ email }, { isVerified: true }, { runValidators: true }),
//         deleteOtp(email)
//     ]);
// };

// export const OTPService = {
//     sendOTP,
//     verifyOTP
// };



import crypto from "crypto";
import { redisClient } from "../../config/redis.config";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/sendEmail";
import { User } from "../user/user.model";

const OTP_EXPIRATION = 2 * 60; // 2 minutes

// In-memory fallback store
const memoryOtpStore = new Map<string, { otp: string; expiresAt: number }>();

// Check if Redis is available
const isRedisAvailable = () => redisClient.isOpen;

// Store OTP (Redis primary, memory fallback)
const storeOtp = async (email: string, otp: string) => {
  const redisKey = `otp:${email}`;

  try {
    if (isRedisAvailable()) {
      await redisClient.set(redisKey, otp, {
        expiration: { type: "EX", value: OTP_EXPIRATION },
      });
      return true;
    }
  } catch (err) {
    console.error("Redis error storing OTP:", err);
  }

  // Fallback to memory only in dev or when Redis fails
  const expiresAt = Date.now() + OTP_EXPIRATION * 1000;
  memoryOtpStore.set(redisKey, { otp, expiresAt });
  setTimeout(() => memoryOtpStore.delete(redisKey), OTP_EXPIRATION * 1000);

  return false;
};

// Retrieve OTP
const getOtp = async (email: string): Promise<string | null> => {
  const redisKey = `otp:${email}`;

  try {
    if (isRedisAvailable()) return await redisClient.get(redisKey);
  } catch (err) {
    console.error("Redis error retrieving OTP:", err);
  }

  // Fallback
  const memoryEntry = memoryOtpStore.get(redisKey);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) return memoryEntry.otp;
  if (memoryEntry) memoryOtpStore.delete(redisKey);
  return null;
};

// Delete OTP
const deleteOtp = async (email: string) => {
  const redisKey = `otp:${email}`;
  try {
    if (isRedisAvailable()) await redisClient.del([redisKey]);
  } catch (err) {
    console.error("Redis error deleting OTP:", err);
  }
  memoryOtpStore.delete(redisKey);
};

// Generate OTP
const generateOtp = (length = 6) =>
  crypto.randomInt(10 ** (length - 1), 10 ** length).toString();

// Send OTP
const sendOTP = async (email: string, name: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(404, "User not found");
  if (user.isVerified) throw new AppError(401, "You are already verified");

  const otp = generateOtp();
  await storeOtp(email, otp);

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp",
    templateData: { name, otp },
  });
};

// Verify OTP
const verifyOTP = async (email: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(404, "User not found");
  if (user.isVerified) throw new AppError(401, "You are already verified");

  const savedOtp = await getOtp(email);
  if (!savedOtp) throw new AppError(401, "Invalid or expired OTP");
  if (savedOtp !== otp) throw new AppError(401, "Invalid OTP");

  await Promise.all([
    User.updateOne({ email }, { isVerified: true }, { runValidators: true }),
    deleteOtp(email),
  ]);
};

export const OTPService = { sendOTP, verifyOTP };
