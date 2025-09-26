import httpStatus from 'http-status';
import { Types } from 'mongoose';
import AppError from '../../errorHelpers/AppError';
import { User } from '../user/user.model';
import { IAddMoneyPayload, ITransaction, IWallet, IWithdrawMoneyPayload } from './wallet.interface';
import { Transaction, Wallet } from './wallet.model';

// Create wallet for user
const createWallet = async (userId: Types.ObjectId): Promise<IWallet> => {
  // Check if user exists
  const userExists = await User.findById(userId);
  if (!userExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if wallet already exists
  const walletExists = await Wallet.findOne({ userId });
  if (walletExists) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Wallet already exists for this user');
  }

  // Create new wallet
  const newWallet = await Wallet.create({
    userId,
    balance: 0,
    currency: 'USD',
  });

  return newWallet;
};

// Get wallet by user ID
const getWalletByUserId = async (userId: Types.ObjectId): Promise<IWallet> => {
  // Find wallet
  let wallet = await Wallet.findOne({ userId });

  // If wallet doesn't exist, create one
  if (!wallet) {
    wallet = await createWallet(userId);
  }

  return wallet;
};

// Add money to wallet
const addMoney = async (payload: IAddMoneyPayload): Promise<{
  transaction: ITransaction;
  wallet: IWallet;
}> => {
  const { userId, amount, method, description } = payload;

  // Validate amount
  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Amount must be greater than zero');
  }

  // Start session for transaction
  const session = await Wallet.startSession();
  
  try {
    session.startTransaction();

    // Get wallet or create if not exists
    let wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) {
      wallet = await Wallet.create([{ userId, balance: 0, currency: 'USD' }], { session });
      wallet = wallet[0];
    }

    // Update wallet balance
    wallet.balance += amount;
    await wallet.save({ session });

    // Create transaction record
    const transaction = await Transaction.create(
      [
        {
          userId,
          amount,
          type: 'credit',
          description: description || 'Added money to wallet',
          status: 'completed',
          method: method || 'card',
          reference: `DEP-${Date.now()}`,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      transaction: transaction[0],
      wallet,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Withdraw money from wallet
const withdrawMoney = async (payload: IWithdrawMoneyPayload): Promise<{
  transaction: ITransaction;
  wallet: IWallet;
}> => {
  const { userId, amount, bankAccount, description } = payload;

  // Validate amount
  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Amount must be greater than zero');
  }

  // Start session for transaction
  const session = await Wallet.startSession();
  
  try {
    session.startTransaction();

    // Get wallet
    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) {
      throw new AppError(httpStatus.NOT_FOUND, 'Wallet not found');
    }

    // Check balance
    if (wallet.balance < amount) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Insufficient balance');
    }

    // Update wallet balance
    wallet.balance -= amount;
    await wallet.save({ session });

    // Create transaction record
    const transaction = await Transaction.create(
      [
        {
          userId,
          amount,
          type: 'debit',
          description: description || `Withdrawn to bank account ${bankAccount}`,
          status: 'completed',
          method: 'bank',
          reference: `WD-${Date.now()}`,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      transaction: transaction[0],
      wallet,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Get transactions by user ID
const getTransactionsByUserId = async (userId: Types.ObjectId): Promise<ITransaction[]> => {
  return Transaction.find({ userId }).sort({ createdAt: -1 });
};

export const WalletService = {
  createWallet,
  getWalletByUserId,
  addMoney,
  withdrawMoney,
  getTransactionsByUserId,
};