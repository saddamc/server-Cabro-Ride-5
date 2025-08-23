import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";

const router = Router();


router.post("/register", validateRequest(createUserZodSchema), 
  UserControllers.createUser
);

router.post("/login", UserControllers.credentialsLogin)

router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);

router.get("/:id", checkAuth(Role.admin, Role.super_admin), UserControllers.getSingleUser);

// ADMIN & USER
router.patch("/update/:id", validateRequest(updateUserZodSchema), checkAuth(...Object.values(Role)), UserControllers.updateUser) 

// ADMIN
router.get("/users", checkAuth(Role.admin, Role.super_admin), UserControllers.getAllUsers);

router.post("/block/:id", checkAuth(Role.admin, Role.super_admin), UserControllers.setBlocked)





export const userRoutes = router;










