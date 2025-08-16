import z from "zod";
import { IsActive, Role } from "./user.interface";

// ✅ createUserZodSchema
export const createUserZodSchema = z.object({
  name: z
    .string({ error: "Name must be string" })
    .min(2, { message: "Name too short. Minimum 2 character long" })
    .max(50, { message: "Name too long" }),
  email: z
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long" })
    .max(100, { message: "Email can't exceed 100 characters" }),
  password: z
    .string({ error: "Password must be string" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/(?=.*[A-Z])/, {
      message: "Password must contain at least 1 uppercase letter",
    })
    .regex(/(?=.*[a-z])/, {
      message: "Password must contain at least 1 lowercase letter",
    })
    .regex(/(?=.*\d)/, {
      message: "Password must contain at least 1 number",
    })
    .regex(/(?=.*[^A-Za-z0-9])/, {
      message: "Password must contain at least 1 special character",
    }),
  phone: z
    .string({ error: "Phone number must be string" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  address: z
    .string({ error: "Address must be string" })
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
});

// ✅ updateUserZodSchema
export const updateUserZodSchema = z.object({
  name: z
    .string({ error: "Name must be string" })
    .min(2, { message: "Name too short. Minimum 2 character long" })
    .max(50, { message: "Name too long" })
    .optional(),
  // password: z
  //   .string({ error: "Password must be string" })
  //   .min(8, { message: "Password must be at least 8 characters long" })
  //   .regex(/(?=.*[A-Z])/, {
  //     message: "Password must contain at least 1 uppercase letter",
  //   })
  //   .regex(/(?=.*[a-z])/, {
  //     message: "Password must contain at least 1 lowercase letter",
  //   })
  //   .regex(/(?=.*\d)/, {
  //     message: "Password must contain at least 1 number",
  //   })
  //   .regex(/(?=.*[^A-Za-z0-9])/, "At least one special character")
  //   .optional(),
  phone: z
    .string({ error: "Phone number must be string" })
    .regex(/^(?:\+8801[3-9]\d{8}|01[3-9]\d{8})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  address: z
    .string({ error: "Address must be string" })
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
  role: z
    .enum(Object.values(Role) as [string])
    .transform((val) => val.toLowerCase())
    .refine((val) => Object.values(Role).includes(val as Role), {
      message: "Invalid role",
    }),
  isActive: z.enum(Object.values(IsActive) as [string]).optional(),
  isDeleted: z.boolean({ error: "isDeleted must be true or false" }).optional(),
  isVerified: z
    .boolean({ error: "isVerified must be true or false" })
    .optional(),
});
