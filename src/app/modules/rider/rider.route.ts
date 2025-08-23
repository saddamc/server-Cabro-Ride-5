import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { RideController } from "./rider.controller";
import { createRideZodSchema } from "./rider.validation";



const router = express.Router();

router.post("/request", validateRequest(createRideZodSchema), checkAuth(...Object.values(Role)), RideController.requestRide);

router.patch("/:id/cancel", checkAuth(...Object.values(Role)), RideController.cancelRide);

router.get("/me", checkAuth(Role.rider, Role.driver), RideController.getMyRides)

// Rating
router.patch("/rating/:id", checkAuth(...Object.values(Role)), RideController.ratingRide)

// ADMIN
router.get("/", checkAuth(Role.admin, Role.super_admin), RideController.getAllRide)



export const riderRoutes = router;