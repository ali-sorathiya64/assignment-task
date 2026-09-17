import express from "express";
import { chatWithAssignmentAI } from "../controllers/ai.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { RoleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI Chat
 *   description: AI-powered assignment chat APIs
 */

/**
 * @swagger
 * /api/ai/chat/{assignmentId}:
 *   post:
 *     summary: Ask AI a question about an assignment
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 example: What do I need to submit for this assignment?
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *       403:
 *         description: Assignment is not assigned to the student
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: AI request failed
 */
router.post(
    "/chat/:assignmentId",
    AuthMiddleware,
    RoleMiddleware("student"),
    chatWithAssignmentAI
);

export default router;