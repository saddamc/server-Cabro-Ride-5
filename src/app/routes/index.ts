import { Router } from "express";
import { adminRoutes } from "../modules/admin/admin.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { driverRoutes } from "../modules/driver/driver.route";
import { locationRoutes } from "../modules/location/location.route";
import { OtpRoutes } from "../modules/otp/otp.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { riderRoutes } from "../modules/rider/rider.route";
import { userRoutes } from "../modules/user/user.route";
import { walletRoutes } from "../modules/wallet/wallet.route";

export const router = Router();

const modelRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/otp", 
    route: OtpRoutes,
  },
  {
    path: "/rides",
    route: riderRoutes,
  },
  {
    path: "/drivers",
    route: driverRoutes,
  },
  {
    path: "/admin",
    route: adminRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/location",
    route: locationRoutes,
  },
  {
    path: "/wallet",
    route: walletRoutes,
  }
];

modelRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
