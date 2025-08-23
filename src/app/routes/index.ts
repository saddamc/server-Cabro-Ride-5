import { Router } from "express";
import { adminRoutes } from "../modules/admin/admin.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { driverRoutes } from "../modules/driver/driver.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { riderRoutes } from "../modules/rider/rider.route";
import { userRoutes } from "../modules/user/user.route";

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
  }


];

modelRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
