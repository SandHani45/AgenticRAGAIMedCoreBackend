import { Router } from "express";
import { updateUserRole } from "../controllers/userController";
import passport from "passport";

const router = Router();

router.patch("/users/:id/role", passport.authenticate("jwt", { session: false }), updateUserRole);

export default router;
