import { Router } from "express";
import { getActiveSessions } from "../controllers/sessionController";
import passport from "passport";

const router = Router();

 router.get("/sessions/active", passport.authenticate("jwt", { session: false }), getActiveSessions);

export default router;
