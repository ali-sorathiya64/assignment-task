import express from "express";
import {
    getGradingDashboard,
    getAssignmentSubmissions,
    saveIndividualGrade,
    saveGroupCommonGrade,
    saveGroupOverride,
    removeGroupOverride,
    getMyGrades
} from "../controllers/grading.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { RoleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Grading
 *   description: Grading and evaluation APIs for professors and students
 */

/**
 * @swagger
 * /api/grading/dashboard:
 *   get:
 *     summary: Get grading dashboard for the logged-in professor
 *     tags: [Grading]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Courses and assignments with grading counts
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get(
    "/dashboard",
    AuthMiddleware,
    RoleMiddleware("admin"),
    getGradingDashboard
);

/**
 * @swagger
 * /api/grading/assignments/{assignmentId}/submissions:
 *   get:
 *     summary: List submissions for an assignment (individual students or groups)
 *     tags: [Grading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assignment with list of gradeable targets
 *       403:
 *         description: Professor does not own this assignment
 *       404:
 *         description: Assignment not found
 */
router.get(
    "/assignments/:assignmentId/submissions",
    AuthMiddleware,
    RoleMiddleware("admin"),
    getAssignmentSubmissions
);

/**
 * @swagger
 * /api/grading/individual:
 *   post:
 *     summary: Save or update an individual assignment grade
 *     tags: [Grading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [submissionId, score]
 *             properties:
 *               submissionId:
 *                 type: integer
 *               score:
 *                 type: number
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Grade saved
 *       400:
 *         description: Invalid input or score out of range
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Submission not found
 *       409:
 *         description: Submission is not confirmed
 */
router.post(
    "/individual",
    AuthMiddleware,
    RoleMiddleware("admin"),
    saveIndividualGrade
);

/**
 * @swagger
 * /api/grading/group/common:
 *   post:
 *     summary: Save or update the common grade for a group submission
 *     tags: [Grading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [groupId, submissionId, score]
 *             properties:
 *               groupId:
 *                 type: integer
 *               submissionId:
 *                 type: integer
 *               score:
 *                 type: number
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group grade saved
 *       400:
 *         description: Invalid input or score out of range
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Submission not found
 *       409:
 *         description: Submission is not confirmed
 */
router.post(
    "/group/common",
    AuthMiddleware,
    RoleMiddleware("admin"),
    saveGroupCommonGrade
);

/**
 * @swagger
 * /api/grading/group/override:
 *   post:
 *     summary: Save or update an individual override for a group member
 *     tags: [Grading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [groupId, studentId, submissionId, score]
 *             properties:
 *               groupId:
 *                 type: integer
 *               studentId:
 *                 type: integer
 *               submissionId:
 *                 type: integer
 *               score:
 *                 type: number
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Override saved
 *       400:
 *         description: Invalid input or student not in group
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Submission not found
 *       409:
 *         description: Submission is not confirmed
 */
router.post(
    "/group/override",
    AuthMiddleware,
    RoleMiddleware("admin"),
    saveGroupOverride
);

/**
 * @swagger
 * /api/grading/group/override/{submissionId}/{studentId}:
 *   delete:
 *     summary: Remove an individual override (member falls back to common grade)
 *     tags: [Grading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Override removed
 *       404:
 *         description: Override not found
 */
router.delete(
    "/group/override/:submissionId/:studentId",
    AuthMiddleware,
    RoleMiddleware("admin"),
    removeGroupOverride
);

/**
 * @swagger
 * /api/grading/my-grades:
 *   get:
 *     summary: Get the logged-in student's own effective grades
 *     tags: [Grading]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of grades for the student's assignments
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Student access required
 */
router.get(
    "/my-grades",
    AuthMiddleware,
    RoleMiddleware("student"),
    getMyGrades
);

export default router;