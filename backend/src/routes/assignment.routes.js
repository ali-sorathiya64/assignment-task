import express from "express";
import {
    createAssignment,
    getAssignments,
    assignToGroup,
    updateAssignment,
    assignToStudent
} from "../controllers/assignment.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { RoleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Assignment management APIs
 */

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Create an assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - due_date
 *               - onedrive_link
 *           example:
 *             title: Database Assignment
 *             description: Complete PostgreSQL exercises
 *             due_date: "2026-09-29T13:59:00.000Z"
 *             onedrive_link: "https://example.com/assignment"
 *             is_global: false
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       400:
 *         description: Required field missing
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.post(
    "/",
    AuthMiddleware,
    RoleMiddleware("admin"),
    createAssignment
);

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: Get assignments available to the current user
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignments
 *       401:
 *         description: Authentication required
 */
router.get(
    "/",
    AuthMiddleware,
    RoleMiddleware("student", "admin"),
    getAssignments
);

/**
 * @swagger
 * /api/assignments/{assignmentId}:
 *   put:
 *     summary: Update an assignment
 *     tags: [Assignments]
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
 *           example:
 *             title: Updated Database Assignment
 *             description: Complete all PostgreSQL exercises
 *             due_date: "2026-09-29T13:59:00.000Z"
 *             onedrive_link: "https://example.com/updated-assignment"
 *             is_global: false
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       404:
 *         description: Assignment not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.put(
    "/:assignmentId",
    AuthMiddleware,
    RoleMiddleware("admin"),
    updateAssignment
);

/**
 * @swagger
 * /api/assignments/{assignmentId}/groups:
 *   post:
 *     summary: Assign an assignment to a group
 *     tags: [Assignments]
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
 *           example:
 *             groupId: 1
 *     responses:
 *       201:
 *         description: Assignment assigned to group successfully
 *       404:
 *         description: Assignment or group not found
 *       409:
 *         description: Assignment already assigned to group
 */
router.post(
    "/:assignmentId/groups",
    AuthMiddleware,
    RoleMiddleware("admin"),
    assignToGroup
);

/**
 * @swagger
 * /api/assignments/{assignmentId}/students:
 *   post:
 *     summary: Assign an assignment to a student
 *     tags: [Assignments]
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
 *           example:
 *             studentId: 2
 *     responses:
 *       201:
 *         description: Assignment assigned to student successfully
 *       404:
 *         description: Assignment or student not found
 *       409:
 *         description: Assignment already assigned to student
 */
router.post(
    "/:assignmentId/students",
    AuthMiddleware,
    RoleMiddleware("admin"),
    assignToStudent
);

export default router;