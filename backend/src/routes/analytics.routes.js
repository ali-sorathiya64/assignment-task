import express from "express";
import { getAssignmentProgress } from "../controllers/analytics.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { RoleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Assignment progress and analytics APIs
 */

/**
 * @swagger
 * /api/analytics/assignments/{assignmentId}:
 *   get:
 *     summary: Get assignment submission progress
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Assignment progress with student submission status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Assignment not found
 */
router.get(
    "/assignments/:assignmentId",
    AuthMiddleware,
    RoleMiddleware("admin"),
    getAssignmentProgress
);

export default router;