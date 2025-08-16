import { z } from "zod";



export const createRideZodSchema = z.object({
    // rider: z.string(), 
    driver: z.string().optional(), 
    // pickupLocation:z.object(z.string()),
    // destinationLocation: z.object(z.string()),
    fare: z.number().optional(),
    status: z.string().optional(),
    statusHistory: z.array(z.string()).optional(),
});

export const updateRideZodSchema = z.object({
    riderId: z.string().optional(), 
    driver: z.string().optional(), 
    // pickupLocation:z.object(z.string()),
    // destinationLocation: z.object(z.string()),
    fare: z.number().optional(),
    status: z.string().optional(),
    statusHistory: z.array(z.string()).optional(),
});

