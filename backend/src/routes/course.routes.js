import express from "express";
import {
    createCourse,
    getMyTaughtCourses,
    getMyEnrolledCourses,
    getCourseDetail,
    updateCourse,
    enrollStudent,
    unenrollStudent
} from "../controllers/course.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { RoleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management and enrollment APIs
 */

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a course (professor)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Database Systems
 *               code:
 *                 type: string
 *                 example: CS301
 *               description:
 *                 type: string
 *                 example: Relational databases and SQL
 *     responses:
 *       201:
 *         description: Course created
 *       409:
 *         description: Course code already exists
 */
router.post(
    "/",
    AuthMiddleware,
    RoleMiddleware("admin"),
    createCourse
);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: List courses taught by the current professor
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses with student and assignment counts
 */
router.get(
    "/",
    AuthMiddleware,
    RoleMiddleware("admin"),
    getMyTaughtCourses
);

/**
 * @swagger
 * /api/courses/my:
 *   get:
 *     summary: List courses the current student is enrolled in
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrolled courses
 */
router.get(
    "/my",
    AuthMiddleware,
    RoleMiddleware("student"),
    getMyEnrolledCourses
);

/**
 * @swagger
 * /api/courses/{courseId}:
 *   get:
 *     summary: Get course detail (with students and assignments)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course detail
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Course not found
 */
router.get(
    "/:courseId",
    AuthMiddleware,
    RoleMiddleware("admin", "student"),
    getCourseDetail
);

/**
 * @swagger
 * /api/courses/{courseId}:
 *   put:
 *     summary: Update a course (professor, owner only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course updated
 */
router.put(
    "/:courseId",
    AuthMiddleware,
    RoleMiddleware("admin"),
    updateCourse
);

/**
 * @swagger
 * /api/courses/{courseId}/students:
 *   post:
 *     summary: Enroll a student in a course
 *     tags: [Courses]
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
 *             properties:
 *               studentId:
 *                 type: integer
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student enrolled
 *       409:
 *         description: Already enrolled
 */
router.post(
    "/:courseId/students",
    AuthMiddleware,
    RoleMiddleware("admin"),
    enrollStudent
);

/**
 * @swagger
 * /api/courses/{courseId}/students/{studentId}:
 *   delete:
 *     summary: Unenroll a student from a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
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
 *         description: Student unenrolled
 */
router.delete(
    "/:courseId/students/:studentId",
    AuthMiddleware,
    RoleMiddleware("admin"),
    unenrollStudent
);

export default router;