
import { Router } from "express";
import passport from "passport";
import { getUser, login, logout, changePassword, refreshToken, register } from "../controllers/authController";

const router = Router();

// All routes require authentication except register and login
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", passport.authenticate("jwt", { session: false }), logout);
router.post("/auth/change-password", passport.authenticate("jwt", { session: false }), changePassword);
router.post("/auth/refresh-token", passport.authenticate("jwt", { session: false }), refreshToken);
router.get("/auth/user", passport.authenticate("jwt", { session: false }), getUser);

export default router;
