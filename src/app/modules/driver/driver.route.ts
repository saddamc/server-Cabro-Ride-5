import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { DriverController } from "./driver.controller";
// import { checkAuth } from "../../middlewares/checkAuth";
// import { Role } from "../user/user.interface";
// import { DriverController } from "./driver.controller";

const router = Router();

router.post("/setOnlineOffline/:id", checkAuth(...Object.values(Role)), DriverController.setOnlineOffline)


export const driverRoutes = router;