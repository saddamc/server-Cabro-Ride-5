import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { WalletService } from './wallet.service';

// Get wallet info
const getWallet = catchAsync(async (req: Request, res: Response) => {
  // Get user ID from request user (set by auth middleware)
  const userId = new Types.ObjectId((req.user as JwtPayload).userId);

  // Get wallet
  const wallet = await WalletService.getWalletByUserId(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Wallet retrieved successfully',
    data: wallet,
  });
});

// Add money to wallet
const addMoney = catchAsync(async (req: Request, res: Response) => {
  // Get user ID from request user
  const userId = new Types.ObjectId((req.user as JwtPayload).userId);

  // Extract data from request body
  const { amount, method, description } = req.body;

  // Add money
  const result = await WalletService.addMoney({
    userId,
    amount: Number(amount),
    method,
    description,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Money added to wallet successfully',
    data: result,
  });
});

// Withdraw money from wallet
const withdrawMoney = catchAsync(async (req: Request, res: Response) => {
  // Get user ID from request user
  const userId = new Types.ObjectId((req.user as JwtPayload).userId);

  // Extract data from request body
  const { amount, bankAccount, description } = req.body;

  // Withdraw money
  const result = await WalletService.withdrawMoney({
    userId,
    amount: Number(amount),
    bankAccount,
    description,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Money withdrawn from wallet successfully',
    data: result,
  });
});

// Get transaction history
const getTransactions = catchAsync(async (req: Request, res: Response) => {
  // Get user ID from request user
  const userId = new Types.ObjectId((req.user as JwtPayload).userId);

  // Get transactions
  const transactions = await WalletService.getTransactionsByUserId(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Transactions retrieved successfully',
    data: transactions,
  });
});

export const WalletController = {
  getWallet,
  addMoney,
  withdrawMoney,
  getTransactions,
};