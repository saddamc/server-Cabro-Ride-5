import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { DriverController } from "./driver.controller";


const router = Router();


router.get("/me", checkAuth(...Object.values(Role)), DriverController.getDriverDetails)

router.post("/apply", checkAuth(...Object.values(Role)), DriverController.applyDriver)

router.post("/available", checkAuth(...Object.values(Role)), DriverController.setOnlineOffline)

router.post("/accept-ride/:id", checkAuth(...Object.values(Role)), DriverController.acceptRide)

router.patch("/reject-ride/:id", checkAuth(...Object.values(Role)), DriverController.rejectRide)

router.patch("/status/:id", checkAuth(...Object.values(Role)), DriverController.updateRideStatus);
router.post("/verify-pin/:id", checkAuth(...Object.values(Role)), DriverController.verifyPin);

router.get("/earnings", checkAuth(...Object.values(Role)), DriverController.driverEarnings)

router.get("/nearby", checkAuth(...Object.values(Role)), DriverController.findNearbyDrivers)

router.patch("/update-me", checkAuth(...Object.values(Role)), DriverController.updateDriverDoc)



// Rating
router.patch("/rating/:id", checkAuth(...Object.values(Role)), DriverController.ratingRide)

// ADMIN
router.patch("approved-driver/:id/", checkAuth(Role.admin, Role.super_admin), DriverController.approvedDriver)

router.patch("/suspend/:id",checkAuth(Role.admin, Role.super_admin), DriverController.suspendDriver)



export const driverRoutes = router;