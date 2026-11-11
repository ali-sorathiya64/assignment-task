import pool from "../db/connection.js";
import { indexAssignment } from "../ai/indexAssignment.js";

const resolveMaxScore = (max_score) => {
    if (max_score === undefined || max_score === null || max_score === "") {
        return { ok: true, value: 100 };
    }
    const parsed = Number(max_score);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return { ok: false };
    }
    return { ok: true, value: parsed };
};

export const createAssignment = async (req, res) => {
    try {
        const {
            title,
            description,
            due_date,
            onedrive_link,
            is_global,
            submission_type,
            course_id,
            max_score
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Assignment title is required"
            });
        }

        if (!due_date) {
            return res.status(400).json({
                success: false,
                message: "Due date is required"
            });
        }

        const parsedDate = new Date(due_date).getTime();
        if (!Number.isFinite(parsedDate)) {
            return res.status(400).json({
                success: false,
                message: "Due date is invalid"
            });
        }

        if (parsedDate <= Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Due date cannot be in the past"
            });
        }

        if (!onedrive_link || !onedrive_link.trim()) {
            return res.status(400).json({
                success: false,
                message: "OneDrive link is required"
            });
        }

        const type = submission_type === "group" ? "group" : "individual";

        const maxCheck = resolveMaxScore(max_score);
        if (!maxCheck.ok) {
            return res.status(400).json({
                success: false,
                message: "max_score must be a positive integer"
            });
        }
        const finalMax = maxCheck.value;

        if (course_id) {
            const courseCheck = await pool.query(
                `SELECT id FROM courses
                 WHERE id = $1 AND professor_id = $2`,
                [course_id, req.user.id]
            );

            if (courseCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You do not own this course"
                });
            }
        }

        const result = await pool.query(
            `INSERT INTO assignments
                (title, description, due_date, onedrive_link,
                 created_by, is_global, submission_type, course_id, max_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING
                id, title, description, due_date, onedrive_link,
                created_by, is_global, submission_type, course_id, max_score,
                created_at, updated_at`,
            [
                title.trim(),
                description?.trim() || null,
                due_date,
                onedrive_link.trim(),
                req.user.id,
                is_global === true,
                type,
                course_id || null,
                finalMax
            ]
        );

        try {
            await indexAssignment(result.rows[0].id);
        } catch (aiError) {
            console.error("AI indexing failed:", aiError.message);
        }

        return res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            assignment: result.rows[0]
        });
    } catch (error) {
        console.error("Create assignment error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getAssignments = async (req, res) => {
    try {
        let result;

        if (req.user.role === "admin") {
            result = await pool.query(
                `SELECT
                    a.id,
                    a.title,
                    a.description,
                    a.due_date,
                    a.onedrive_link,
                    a.created_by,
                    a.is_global,
                    a.submission_type,
                    a.course_id,
                    a.max_score,
                    a.created_at,
                    a.updated_at
                 FROM assignments a
                 ORDER BY a.due_date ASC`
            );
        } else {
            result = await pool.query(
                `SELECT DISTINCT
                    a.id,
                    a.title,
                    a.description,
                    a.due_date,
                    a.onedrive_link,
                    a.created_by,
                    a.is_global,
                    a.submission_type,
                    a.course_id,
                    a.max_score,
                    a.created_at,
                    a.updated_at
                 FROM assignments a
                 WHERE a.is_global = true
                 OR EXISTS (
                    SELECT 1
                    FROM assignment_groups ag
                    JOIN group_members gm
                        ON gm.group_id = ag.group_id
                    WHERE ag.assignment_id = a.id
                      AND gm.user_id = $1
                 )
                 OR EXISTS (
                    SELECT 1
                    FROM assignment_students ast
                    WHERE ast.assignment_id = a.id
                      AND ast.student_id = $1
                 )
                 OR a.course_id IN (
                    SELECT cs.course_id
                    FROM course_students cs
                    WHERE cs.student_id = $1
                 )
                 ORDER BY a.due_date ASC`,
                [req.user.id]
            );
        }

        return res.status(200).json({
            success: true,
            assignments: result.rows
        });
    } catch (error) {
        console.error("Get assignments error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const assignToGroup = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group ID is required"
            });
        }

        const assignmentResult = await pool.query(
            `SELECT a.id, a.title, a.course_id,
                    COALESCE(c.professor_id, a.created_by) AS owner_id
             FROM assignments a
             LEFT JOIN courses c ON c.id = a.course_id
             WHERE a.id = $1`,
            [assignmentId]
        );

        if (assignmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        const assignment = assignmentResult.rows[0];

        if (assignment.owner_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You do not own this assignment"
            });
        }

        const groupResult = await pool.query(
            `SELECT id, name FROM groups WHERE id = $1`,
            [groupId]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        if (assignment.course_id) {
            const invalidMembers = await pool.query(
                `SELECT gm.user_id
                 FROM group_members gm
                 WHERE gm.group_id = $1
                   AND NOT EXISTS (
                       SELECT 1 FROM course_students cs
                       WHERE cs.course_id = $2 AND cs.student_id = gm.user_id
                   )`,
                [groupId, assignment.course_id]
            );

            if (invalidMembers.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "All group members must be enrolled in the assignment's course"
                });
            }
        }

        const existingAssignment = await pool.query(
            `SELECT id FROM assignment_groups
             WHERE assignment_id = $1 AND group_id = $2`,
            [assignmentId, groupId]
        );

        if (existingAssignment.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Assignment is already assigned to this group"
            });
        }

        const result = await pool.query(
            `INSERT INTO assignment_groups (assignment_id, group_id)
             VALUES ($1, $2)
             RETURNING id, assignment_id, group_id`,
            [assignmentId, groupId]
        );

        return res.status(201).json({
            success: true,
            message: "Assignment assigned to group successfully",
            assignmentGroup: result.rows[0]
        });
    } catch (error) {
        console.error("Assign assignment to group error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const assignToStudent = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required"
            });
        }

        const assignmentResult = await pool.query(
            `SELECT a.id, a.title,
                    COALESCE(c.professor_id, a.created_by) AS owner_id
             FROM assignments a
             LEFT JOIN courses c ON c.id = a.course_id
             WHERE a.id = $1`,
            [assignmentId]
        );

        if (assignmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        if (assignmentResult.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You do not own this assignment"
            });
        }

        const studentResult = await pool.query(
            `SELECT id, name, email, role FROM users
             WHERE id = $1 AND role = 'student'`,
            [studentId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const existingAssignment = await pool.query(
            `SELECT id FROM assignment_students
             WHERE assignment_id = $1 AND student_id = $2`,
            [assignmentId, studentId]
        );

        if (existingAssignment.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Assignment is already assigned to this student"
            });
        }

        const result = await pool.query(
            `INSERT INTO assignment_students (assignment_id, student_id)
             VALUES ($1, $2)
             RETURNING id, assignment_id, student_id`,
            [assignmentId, studentId]
        );

        return res.status(201).json({
            success: true,
            message: "Assignment assigned to student successfully",
            assignmentStudent: result.rows[0]
        });
    } catch (error) {
        console.error("Assign assignment to student error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const {
            title,
            description,
            due_date,
            onedrive_link,
            is_global,
            submission_type,
            course_id,
            max_score
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Assignment title is required"
            });
        }

        if (!due_date) {
            return res.status(400).json({
                success: false,
                message: "Due date is required"
            });
        }

        const parsedDate = new Date(due_date).getTime();
        if (!Number.isFinite(parsedDate)) {
            return res.status(400).json({
                success: false,
                message: "Due date is invalid"
            });
        }

        if (!onedrive_link || !onedrive_link.trim()) {
            return res.status(400).json({
                success: false,
                message: "OneDrive link is required"
            });
        }

        const existingAssignment = await pool.query(
            `SELECT a.id, a.due_date,
                    COALESCE(c.professor_id, a.created_by) AS owner_id
             FROM assignments a
             LEFT JOIN courses c ON c.id = a.course_id
             WHERE a.id = $1`,
            [assignmentId]
        );

        if (existingAssignment.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        if (existingAssignment.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You do not own this assignment"
            });
        }

        const oldDate = new Date(existingAssignment.rows[0].due_date).getTime();

        if (parsedDate !== oldDate && parsedDate <= Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Due date cannot be in the past"
            });
        }

        const type = submission_type === "group" ? "group" : "individual";

        const maxCheck = resolveMaxScore(max_score);
        if (!maxCheck.ok) {
            return res.status(400).json({
                success: false,
                message: "max_score must be a positive integer"
            });
        }
        const finalMax = maxCheck.value;

        if (course_id) {
            const courseCheck = await pool.query(
                `SELECT id FROM courses
                 WHERE id = $1 AND professor_id = $2`,
                [course_id, req.user.id]
            );

            if (courseCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You do not own this course"
                });
            }
        }

        const result = await pool.query(
            `UPDATE assignments
             SET
                title = $1,
                description = $2,
                due_date = $3,
                onedrive_link = $4,
                is_global = $5,
                submission_type = $6,
                course_id = $7,
                max_score = $8,
                updated_at = NOW()
             WHERE id = $9
             RETURNING
                id, title, description, due_date, onedrive_link,
                created_by, is_global, submission_type, course_id, max_score,
                created_at, updated_at`,
            [
                title.trim(),
                description?.trim() || null,
                due_date,
                onedrive_link.trim(),
                is_global === true,
                type,
                course_id || null,
                finalMax,
                assignmentId
            ]
        );

        try {
            await indexAssignment(result.rows[0].id);
        } catch (aiError) {
            console.error("AI indexing failed:", aiError.message);
        }

        return res.status(200).json({
            success: true,
            message: "Assignment updated successfully",
            assignment: result.rows[0]
        });
    } catch (error) {
        console.error("Update assignment error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};