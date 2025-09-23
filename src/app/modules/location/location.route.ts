import express from "express";
import { LocationController } from "./location.controller";

const router = express.Router();

/**
 * @route GET /api/location/search
 * @desc Search for locations based on query string
 * @access Public
 */
router.get("/search", LocationController.searchLocations);

/**
 * @route GET /api/location/reverse
 * @desc Reverse geocode coordinates to address
 * @access Public
 */
router.get("/reverse", LocationController.reverseGeocode);

export const locationRoutes = router;