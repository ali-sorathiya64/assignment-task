import pool from "../db/connection.js";
import { indexAssignment } from "../ai/indexAssignment.js";

export const createAssignment = async (req, res) => {
    try {
        const {
            title,
            description,
            due_date,
            onedrive_link,
            is_global
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

        if (!onedrive_link || !onedrive_link.trim()) {
            return res.status(400).json({
                success: false,
                message: "OneDrive link is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO assignments
        (title, description, due_date, onedrive_link, created_by, is_global)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
        id,
        title,
        description,
        due_date,
        onedrive_link,
        created_by,
        is_global,
        created_at,
        updated_at`,
            [
                title.trim(),
                description?.trim() || null,
                due_date,
                onedrive_link.trim(),
                req.user.id,
                is_global === true
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
            `SELECT id, title
             FROM assignments
             WHERE id = $1`,
            [assignmentId]
        );

        if (assignmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        const groupResult = await pool.query(
            `SELECT id, name
             FROM groups
             WHERE id = $1`,
            [groupId]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        const existingAssignment = await pool.query(
            `SELECT id
             FROM assignment_groups
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
            `INSERT INTO assignment_groups
                (assignment_id, group_id)
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
            `SELECT id, title
             FROM assignments
             WHERE id = $1`,
            [assignmentId]
        );

        if (assignmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        const studentResult = await pool.query(
            `SELECT id, name, email, role
             FROM users
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
            `SELECT id
             FROM assignment_students
             WHERE assignment_id = $1
               AND student_id = $2`,
            [assignmentId, studentId]
        );

        if (existingAssignment.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Assignment is already assigned to this student"
            });
        }

        const result = await pool.query(
            `INSERT INTO assignment_students
                (assignment_id, student_id)
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
            is_global
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

        if (!onedrive_link || !onedrive_link.trim()) {
            return res.status(400).json({
                success: false,
                message: "OneDrive link is required"
            });
        }

        const existingAssignment = await pool.query(
            `SELECT id
             FROM assignments
             WHERE id = $1`,
            [assignmentId]
        );

        if (existingAssignment.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        const result = await pool.query(
            `UPDATE assignments
     SET
        title = $1,
        description = $2,
        due_date = $3,
        onedrive_link = $4,
        is_global = $5,
        updated_at = NOW()
     WHERE id = $6
     RETURNING
        id,
        title,
        description,
        due_date,
        onedrive_link,
        created_by,
        is_global,
        created_at,
        updated_at`,
            [
                title.trim(),
                description?.trim() || null,
                due_date,
                onedrive_link.trim(),
                is_global === true,
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