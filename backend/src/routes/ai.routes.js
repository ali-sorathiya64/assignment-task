import express from "express";
import {
    chatWithAssignmentAI,
    chatWithCourseAI
} from "../controllers/ai.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { RoleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI Chat
 *   description: AI-powered assignment and course chat APIs
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 *       400:
 *         description: Invalid input
 *       500:
 *         description: AI request failed
 */
router.post(
    "/chat/:assignmentId",
    AuthMiddleware,
    RoleMiddleware("student"),
    chatWithAssignmentAI
);

/**
 * @swagger
 * /api/ai/chat/course/{courseId}:
 *   post:
 *     summary: Ask AI a question about a course
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 *       400:
 *         description: Invalid input
 *       500:
 *         description: AI request failed
 */
router.post(
    "/chat/course/:courseId",
    AuthMiddleware,
    RoleMiddleware("student"),
    chatWithCourseAI
);

export default router;