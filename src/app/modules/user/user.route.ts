import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";



const router = Router()
router.post("/register", validateRequest(createUserZodSchema), 
  UserControllers.createUser
);


router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);

router.get("/:id", checkAuth(Role.admin, Role.super_admin), UserControllers.getSingleUser);

// ADMIN & USER
router.patch("/update/:id", validateRequest(updateUserZodSchema), checkAuth(...Object.values(Role)), UserControllers.updateUser) 

// ADMIN
router.get("/", checkAuth(Role.admin, Role.super_admin), UserControllers.getAllUsers);

router.patch("/block/:id", checkAuth(Role.admin, Role.super_admin), UserControllers.setBlocked)

router.patch("/activate/:id", checkAuth(Role.admin, Role.super_admin), UserControllers.activateUser)

router.patch("/suspend/:id", checkAuth(Role.admin, Role.super_admin), UserControllers.suspendUser)


export const userRoutes = router;















