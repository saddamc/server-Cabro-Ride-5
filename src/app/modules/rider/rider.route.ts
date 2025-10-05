import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { RideController } from "./rider.controller";
import { createRideZodSchema } from "./rider.validation";



const router = express.Router();

router.post("/request", validateRequest(createRideZodSchema), checkAuth(Role.rider), RideController.requestRide);

router.patch("/:id/cancel", checkAuth(Role.rider, Role.driver), RideController.cancelRide);

// Get active ride for current user
router.get("/active", checkAuth(Role.rider, Role.driver), RideController.getActiveRide);

// Get available rides for drivers
router.get("/available", checkAuth(Role.driver), RideController.getAvailableRides);

router.get("/me", checkAuth(Role.rider, Role.driver), RideController.getMyRides);

// ADMIN
router.get("/", RideController.getAllRide)
router.get("/all", RideController.getAllBookingsForAdmin)
router.get("/earnings", RideController.getEarningsData)
router.get("/volume", RideController.getRideVolumeData)
router.get("/activity", RideController.getDriverActivityData)

router.get("/:id", checkAuth(Role.rider, Role.driver), RideController.getRideById);

// Rating
router.patch("/rating/:id", checkAuth(Role.rider, Role.driver), RideController.ratingRide)

// Complete payment
router.patch("/:id/complete-payment", checkAuth(Role.rider, Role.driver), RideController.completePayment)



export const riderRoutes = router;