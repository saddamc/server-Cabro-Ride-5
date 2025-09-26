import mongoose, { Schema } from 'mongoose';
import { ITransaction, IWallet } from './wallet.interface';

// Schema for transactions
const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    method: {
      type: String,
      enum: ['card', 'bank', 'wallet', 'ride', 'system'],
      required: true,
    },
    reference: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

// Schema for wallet
const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

export const Transaction = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema,
);

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);