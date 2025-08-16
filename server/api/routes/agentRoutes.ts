
import { Router } from "express";
import passport from "passport";
import { askMe } from "../controllers/agentController";
import { getUser } from "../controllers/authController";

const router = Router();

// API ROUTES FOR AGENT

/**
 * POST /api/agent/askMe
 * Purpose: Query the RAG pipeline (ICD10.pdf) with a user question and get a context-based answer.
 * Auth: Requires JWT authentication.
 * Body: { query: string, k?: number }
 * Returns: { answer: string }
 */
router.post("/agent/askMe", passport.authenticate("jwt", { session: false }), askMe);

export default router;
