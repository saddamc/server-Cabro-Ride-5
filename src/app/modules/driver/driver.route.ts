import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { DriverController } from "./driver.controller";


const router = Router();


router.post("/apply-driver", checkAuth(...Object.values(Role)), DriverController.applyDriver)

router.post("/online-offline", checkAuth(...Object.values(Role)), DriverController.setOnlineOffline)

router.post("/accept-ride/:id", checkAuth(...Object.values(Role)), DriverController.acceptRide)

router.patch("/reject/:id", checkAuth(...Object.values(Role)), DriverController.rejectRide)

router.patch("/driver-status/:id", checkAuth(...Object.values(Role)), DriverController.updateRideStatus);

router.get("/earning", checkAuth(...Object.values(Role)), DriverController.driverEarnings)


router.post("/status/:id", checkAuth(Role.admin, Role.super_admin), DriverController.approvedDriver)





export const driverRoutes = router;