import express from "express";
import {
    createGroup,
    addMember,
    getMyGroups,
    getAllGroups
} from "../controllers/group.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { RoleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Student group management APIs
 */

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Team Alpha
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Group name is required
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Student access required
 */
router.post(
    "/",
    AuthMiddleware,
    RoleMiddleware("student"),
    createGroup
);

/**
 * @swagger
 * /api/groups/all:
 *   get:
 *     summary: Get all groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All groups with their members
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get(
    "/all",
    AuthMiddleware,
    RoleMiddleware("admin"),
    getAllGroups
);

/**
 * @swagger
 * /api/groups/{groupId}/members:
 *   post:
 *     summary: Add a student to a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
 *             properties:
 *               email:
 *                 type: string
 *                 example: kai@gmail.com
 *               studentId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Student added to group successfully
 *       400:
 *         description: Student email or ID is required
 *       403:
 *         description: User is not a member of the group
 *       404:
 *         description: Group or student not found
 *       409:
 *         description: Student is already a member
 */
router.post(
    "/:groupId/members",
    AuthMiddleware,
    RoleMiddleware("student"),
    addMember
);

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get groups of the current student
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student groups with members
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Student access required
 */
router.get(
    "/",
    AuthMiddleware,
    RoleMiddleware("student"),
    getMyGroups
);

export default router;