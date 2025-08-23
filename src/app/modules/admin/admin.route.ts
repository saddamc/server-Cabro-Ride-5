import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { AdminController } from "./admin.controller";



const router = Router();


router.get("/analytics", checkAuth(Role.admin, Role.super_admin), AdminController.getAnalytics)



export const adminRoutes = router;