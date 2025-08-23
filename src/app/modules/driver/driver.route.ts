import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { DriverController } from "./driver.controller";


const router = Router();


router.post("/apply", checkAuth(...Object.values(Role)), DriverController.applyDriver)

router.post("/available", checkAuth(...Object.values(Role)), DriverController.setOnlineOffline)

router.post("/accept-ride/:id", checkAuth(...Object.values(Role)), DriverController.acceptRide)

router.patch("/reject-ride/:id", checkAuth(...Object.values(Role)), DriverController.rejectRide)

router.patch("/update-status/:id", checkAuth(...Object.values(Role)), DriverController.updateRideStatus);

router.get("/earning", checkAuth(...Object.values(Role)), DriverController.driverEarnings)

// ADMIN
router.post("/status/:id", checkAuth(Role.admin, Role.super_admin), DriverController.approvedDriver)





export const driverRoutes = router;