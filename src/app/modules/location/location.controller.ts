import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { LocationService } from "./location.service";

// Search for locations based on query string
const searchLocations = catchAsync(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  
  if (!query || query.length < 3) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Search query must be at least 3 characters",
      data: [],
    });
  }

  const locations = await LocationService.searchLocations(query);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Locations retrieved successfully",
    data: locations,
  });
});

// Reverse geocode coordinates to address
const reverseGeocode = catchAsync(async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  
  if (isNaN(lat) || isNaN(lng)) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Invalid coordinates provided",
      data: null,
    });
  }

  const location = await LocationService.reverseGeocode(lat, lng);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Address retrieved successfully",
    data: location,
  });
});

export const LocationController = {
  searchLocations,
  reverseGeocode,
};