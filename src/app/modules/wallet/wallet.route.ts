import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { WalletController } from "./wallet.controller";
import { addMoneyZodSchema, withdrawMoneyZodSchema } from "./wallet.validation";

const router = Router();

// Get wallet info - Any authenticated user
router.get("/", 
  checkAuth(...Object.values(Role)), 
  WalletController.getWallet
);

// Add money to wallet - Any authenticated user
router.post("/deposit", 
  checkAuth(...Object.values(Role)),
  validateRequest(addMoneyZodSchema), 
  WalletController.addMoney
);

// Withdraw money from wallet - Any authenticated user
router.post("/withdraw", 
  checkAuth(...Object.values(Role)),
  validateRequest(withdrawMoneyZodSchema),  
  WalletController.withdrawMoney
);

// Get transaction history - Any authenticated user
router.get("/transactions", 
  checkAuth(...Object.values(Role)), 
  WalletController.getTransactions
);

export const walletRoutes = router;