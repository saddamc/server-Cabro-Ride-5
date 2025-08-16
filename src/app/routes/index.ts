import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { driverRoutes } from "../modules/driver/driver.route";
import { riderRoutes } from "../modules/rider/rider.route";
import { userRoutes } from "../modules/user/user.route";

export const router = Router();

const modelRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/ride",
    route: riderRoutes,
  },
  {
    path: "/driver",
    route: driverRoutes,
  },


];

modelRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
