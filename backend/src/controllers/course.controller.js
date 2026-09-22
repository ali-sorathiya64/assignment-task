import pool from "../db/connection.js";
import { indexCourse } from "../ai/indexCourse.js";

export const createCourse = async (req, res) => {
    try {
        const { name, code, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Course name is required"
            });
        }

        if (!code || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Course code is required"
            });
        }

        const normalizedCode = code.trim().toUpperCase();

        const existing = await pool.query(
            `SELECT id FROM courses WHERE code = $1`,
            [normalizedCode]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A course with this code already exists"
            });
        }

        const result = await pool.query(
            `INSERT INTO courses (name, code, description, professor_id)
             VALUES ($1, $2, $3, $4)
             RETURNING
                id,
                name,
                code,
                description,
                professor_id,
                created_at,
                updated_at`,
            [
                name.trim(),
                normalizedCode,
                description?.trim() || null,
                req.user.id
            ]
        );

        try {
            await indexCourse(result.rows[0].id);
        } catch (aiError) {
            console.error("Course AI indexing failed:", aiError.message);
        }

        return res.status(201).json({
            success: true,
            message: "Course created successfully",
            course: result.rows[0]
        });
    } catch (error) {
        console.error("Create course error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getMyTaughtCourses = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                c.id,
                c.name,
                c.code,
                c.description,
                c.professor_id,
                c.created_at,
                c.updated_at,
                COUNT(DISTINCT cs.student_id)::int AS student_count,
                COUNT(DISTINCT a.id)::int AS assignment_count
             FROM courses c
             LEFT JOIN course_students cs ON cs.course_id = c.id
             LEFT JOIN assignments a ON a.course_id = c.id
             WHERE c.professor_id = $1
             GROUP BY c.id
             ORDER BY c.created_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            courses: result.rows
        });
    } catch (error) {
        console.error("Get taught courses error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getMyEnrolledCourses = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                c.id,
                c.name,
                c.code,
                c.description,
                c.professor_id,
                u.name AS professor_name,
                u.email AS professor_email,
                c.created_at,
                COUNT(DISTINCT a.id)::int AS assignment_count
             FROM courses c
             JOIN course_students cs ON cs.course_id = c.id
             JOIN users u ON u.id = c.professor_id
             LEFT JOIN assignments a ON a.course_id = c.id
             WHERE cs.student_id = $1
             GROUP BY c.id, u.name, u.email
             ORDER BY c.created_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            courses: result.rows
        });
    } catch (error) {
        console.error("Get enrolled courses error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getCourseDetail = async (req, res) => {
    try {
        const { courseId } = req.params;

        const courseResult = await pool.query(
            `SELECT
                c.id,
                c.name,
                c.code,
                c.description,
                c.professor_id,
                u.name AS professor_name,
                u.email AS professor_email,
                c.created_at,
                c.updated_at
             FROM courses c
             JOIN users u ON u.id = c.professor_id
             WHERE c.id = $1`,
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const course = courseResult.rows[0];

        if (req.user.role === "admin") {
            if (course.professor_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "You do not own this course"
                });
            }
        } else {
            const enrollment = await pool.query(
                `SELECT id FROM course_students
                 WHERE course_id = $1 AND student_id = $2`,
                [courseId, req.user.id]
            );

            if (enrollment.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You are not enrolled in this course"
                });
            }
        }

        const [studentsResult, assignmentsResult] = await Promise.all([
            pool.query(
                `SELECT
                    u.id,
                    u.name,
                    u.email,
                    cs.enrolled_at
                 FROM course_students cs
                 JOIN users u ON u.id = cs.student_id
                 WHERE cs.course_id = $1
                 ORDER BY u.name`,
                [courseId]
            ),
            pool.query(
                `SELECT
                    id,
                    title,
                    description,
                    due_date,
                    onedrive_link,
                    is_global,
                    submission_type,
                    created_at,
                    updated_at
                 FROM assignments
                 WHERE course_id = $1
                 ORDER BY due_date ASC`,
                [courseId]
            )
        ]);

        return res.status(200).json({
            success: true,
            course,
            students: studentsResult.rows,
            assignments: assignmentsResult.rows
        });
    } catch (error) {
        console.error("Get course detail error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Course name is required"
            });
        }

        const existing = await pool.query(
            `SELECT id, professor_id FROM courses WHERE id = $1`,
            [courseId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (existing.rows[0].professor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You do not own this course"
            });
        }

        const result = await pool.query(
            `UPDATE courses
             SET name = $1,
                 description = $2,
                 updated_at = NOW()
             WHERE id = $3
             RETURNING
                id,
                name,
                code,
                description,
                professor_id,
                created_at,
                updated_at`,
            [name.trim(), description?.trim() || null, courseId]
        );

        try {
            await indexCourse(result.rows[0].id);
        } catch (aiError) {
            console.error("Course AI indexing failed:", aiError.message);
        }

        return res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course: result.rows[0]
        });
    } catch (error) {
        console.error("Update course error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const enrollStudent = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { studentId, email } = req.body;

        if (!studentId && !email) {
            return res.status(400).json({
                success: false,
                message: "Student ID or email is required"
            });
        }

        const courseResult = await pool.query(
            `SELECT id, professor_id FROM courses WHERE id = $1`,
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (courseResult.rows[0].professor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You do not own this course"
            });
        }

        let studentResult;

        if (studentId) {
            studentResult = await pool.query(
                `SELECT id, name, email FROM users
                 WHERE id = $1 AND role = 'student'`,
                [studentId]
            );
        } else {
            studentResult = await pool.query(
                `SELECT id, name, email FROM users
                 WHERE email = $1 AND role = 'student'`,
                [email.trim().toLowerCase()]
            );
        }

        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const student = studentResult.rows[0];

        const existing = await pool.query(
            `SELECT id FROM course_students
             WHERE course_id = $1 AND student_id = $2`,
            [courseId, student.id]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Student is already enrolled in this course"
            });
        }

        await pool.query(
            `INSERT INTO course_students (course_id, student_id)
             VALUES ($1, $2)`,
            [courseId, student.id]
        );

        try {
            await indexCourse(Number(courseId));
        } catch (aiError) {
            console.error("Course AI re-index failed:", aiError.message);
        }

        return res.status(201).json({
            success: true,
            message: "Student enrolled successfully",
            student
        });
    } catch (error) {
        console.error("Enroll student error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const unenrollStudent = async (req, res) => {
    try {
        const { courseId, studentId } = req.params;

        const courseResult = await pool.query(
            `SELECT id, professor_id FROM courses WHERE id = $1`,
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (courseResult.rows[0].professor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You do not own this course"
            });
        }

        const result = await pool.query(
            `DELETE FROM course_students
             WHERE course_id = $1 AND student_id = $2
             RETURNING id`,
            [courseId, studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student is not enrolled in this course"
            });
        }

        try {
            await indexCourse(Number(courseId));
        } catch (aiError) {
            console.error("Course AI re-index failed:", aiError.message);
        }

        return res.status(200).json({
            success: true,
            message: "Student unenrolled successfully"
        });
    } catch (error) {
        console.error("Unenroll student error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};