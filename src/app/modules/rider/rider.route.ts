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

router.get("/me", checkAuth(Role.rider, Role.driver), RideController.getMyRides)

// Get available rides for drivers
router.get("/available", checkAuth(Role.driver), RideController.getAvailableRides)

// Rating
router.patch("/rating/:id", checkAuth(Role.rider, Role.driver), RideController.ratingRide)

// ADMIN
router.get("/", checkAuth(Role.admin, Role.super_admin), RideController.getAllRide)



export const riderRoutes = router;