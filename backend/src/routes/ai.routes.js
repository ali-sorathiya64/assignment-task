import express from "express";
import { chatWithAssignmentAI } from "../controllers/ai.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { RoleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
    "/chat/:assignmentId",
    AuthMiddleware,
    RoleMiddleware("student"),
    chatWithAssignmentAI
);

export default router;