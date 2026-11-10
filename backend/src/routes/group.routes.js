import express from "express";
import {
    createGroup,
    addMember,
    getMyGroups,
    getAllGroups,
    updateGroup,
    removeMember,
    deleteGroup
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               studentId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Student added to group successfully
 */
router.post(
    "/:groupId/members",
    AuthMiddleware,
    RoleMiddleware("student"),
    addMember
);

/**
 * @swagger
 * /api/groups/{groupId}:
 *   put:
 *     summary: Rename a group (leader only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group updated
 *       403:
 *         description: Only the leader can edit
 */
router.put(
    "/:groupId",
    AuthMiddleware,
    RoleMiddleware("student"),
    updateGroup
);

/**
 * @swagger
 * /api/groups/{groupId}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a group (leader only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Member removed
 *       403:
 *         description: Only the leader can remove members
 */
router.delete(
    "/:groupId/members/:userId",
    AuthMiddleware,
    RoleMiddleware("student"),
    removeMember
);

/**
 * @swagger
 * /api/groups/{groupId}:
 *   delete:
 *     summary: Delete a group (leader only, no assignments attached)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Group deleted
 *       403:
 *         description: Only the leader can delete
 *       409:
 *         description: Group has assignments attached
 */
router.delete(
    "/:groupId",
    AuthMiddleware,
    RoleMiddleware("student"),
    deleteGroup
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
 */
router.get(
    "/",
    AuthMiddleware,
    RoleMiddleware("student"),
    getMyGroups
);

export default router;