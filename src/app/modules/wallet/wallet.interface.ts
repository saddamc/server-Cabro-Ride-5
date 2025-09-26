import { Types } from 'mongoose';

export interface IWallet {
  userId: Types.ObjectId;
  balance: number;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITransaction {
  userId: Types.ObjectId;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  method: 'card' | 'bank' | 'wallet' | 'ride' | 'system';
  reference?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAddMoneyPayload {
  userId: Types.ObjectId;
  amount: number;
  method: string;
  description?: string;
}

export interface IWithdrawMoneyPayload {
  userId: Types.ObjectId;
  amount: number;
  bankAccount: string;
  description?: string;
}