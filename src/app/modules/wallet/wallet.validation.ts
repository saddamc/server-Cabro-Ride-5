import { z } from 'zod';

// Schema for adding money to wallet
export const addMoneyZodSchema = z.object({
  body: z.object({
    amount: z.number().positive({
      message: 'Amount must be a positive number',
    }),
    method: z.enum(['card', 'bank', 'mobile']).optional(),
    description: z.string().optional(),
  }),
});

// Schema for withdrawing money from wallet
export const withdrawMoneyZodSchema = z.object({
  body: z.object({
    amount: z.number().positive({
      message: 'Amount must be a positive number',
    }),
    bankAccount: z.string().min(1, {
      message: 'Bank account information is required for withdrawal',
    }),
    description: z.string().optional(),
  }),
});