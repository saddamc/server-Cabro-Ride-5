import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { RideController } from "./rider.controller";
import { createRideZodSchema } from "./rider.validation";



const router = express.Router();

router.post("/request-ride", validateRequest(createRideZodSchema), RideController.requestRide);
router.patch("/cancel-ride", checkAuth(...Object.values(Role)), RideController.cancelRide);
router.get("/ride-history/:id", checkAuth(...Object.values(Role)), RideController.getRideHistory)

router.get("/", checkAuth(Role.admin, Role.super_admin), RideController.getAllRide)



export const riderRoutes = router;