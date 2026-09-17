import express from "express";
import {
    confirmSubmission,
    getSubmissionStatus
} from "../controllers/submission.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { RoleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Assignment submission APIs
 */

/**
 * @swagger
 * /api/submissions/{assignmentId}/confirm:
 *   post:
 *     summary: Confirm assignment submission
 *     tags: [Submissions]
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
 *       201:
 *         description: Submission confirmed successfully
 *       200:
 *         description: Existing submission confirmed successfully
 *       403:
 *         description: Assignment is not assigned to the student
 *       404:
 *         description: Assignment not found
 *       409:
 *         description: Submission is already confirmed
 */
router.post(
    "/:assignmentId/confirm",
    AuthMiddleware,
    RoleMiddleware("student"),
    confirmSubmission
);

/**
 * @swagger
 * /api/submissions/{assignmentId}/status:
 *   get:
 *     summary: Get submission status
 *     tags: [Submissions]
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
 *         description: Submission status
 *       401:
 *         description: Authentication required
 */
router.get(
    "/:assignmentId/status",
    AuthMiddleware,
    RoleMiddleware("student"),
    getSubmissionStatus
);

export default router;