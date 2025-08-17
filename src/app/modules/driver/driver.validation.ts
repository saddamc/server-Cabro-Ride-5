import mongoose from 'mongoose';
import { z } from 'zod';

export const driverValidationSchema = z.object({
    user: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid user ObjectId',
    }),
    licenseNumber: z.string().min(3, { message: 'License number is required' }),
    vehicleType: z.object({
        type: z.string().min(1, { message: 'Vehicle type is required' }),
        brand: z.string().min(1, { message: 'Brand is required' }),
        model: z.string().min(1, { message: 'Model is required'} ),
        plateNumber: z.string().min(1, { message: 'Plate number is required' }),
    }),
    status: z.enum(['pending', 'approved', 'suspended', 'rejected']).default('pending'),
    availability: z.enum(['online', 'offline', 'busy']).default('offline'),
    location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z
        .array(z.number())
        .length(2, { message: 'Coordinates must be [longitude, latitude]' }),
    address: z.string().optional(),
    }),
    earnings: z.object({
    total: z.number().nonnegative().default(0),
    currency: z.string().default('USD'),
    }).optional(),
    rating: z.object({
    average: z.number().min(0).max(5).default(0),
    totalReviews: z.number().nonnegative().default(0),
    }).optional(),
    documents: z.object({
    licenseImage: z.string().url().optional(),
    vehicleRegistration: z.string().url().optional(),
    insurance: z.string().url().optional(),
    }).optional(),
    activeRide: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Invalid ride ObjectId',
    })
    .optional(),
    approvedAt: z.coerce.date().optional(),
});
