import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import passport from "passport";

const router = Router();

 router.get("/dashboard/stats", passport.authenticate("jwt", { session: false }), getDashboardStats);

export default router;
