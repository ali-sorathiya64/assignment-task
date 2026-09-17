import pool from "../db/connection.js";

export const confirmSubmission = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignmentResult = await pool.query(
            `SELECT id, is_global
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

        const assignment = assignmentResult.rows[0];

        const groupResult = await pool.query(
            `SELECT ag.group_id
             FROM assignment_groups ag
             JOIN group_members gm
                ON gm.group_id = ag.group_id
             WHERE ag.assignment_id = $1
               AND gm.user_id = $2
             LIMIT 1`,
            [assignmentId, req.user.id]
        );

        const studentAssignmentResult = await pool.query(
            `SELECT id
             FROM assignment_students
             WHERE assignment_id = $1
               AND student_id = $2`,
            [assignmentId, req.user.id]
        );

        if (
            !assignment.is_global &&
            groupResult.rows.length === 0 &&
            studentAssignmentResult.rows.length === 0
        ) {
            return res.status(403).json({
                success: false,
                message: "This assignment is not assigned to you"
            });
        }

        const groupId = groupResult.rows.length > 0
            ? groupResult.rows[0].group_id
            : null;

        const existingSubmission = await pool.query(
            `SELECT id, confirmed
             FROM submissions
             WHERE assignment_id = $1
               AND student_id = $2`,
            [assignmentId, req.user.id]
        );

        if (existingSubmission.rows.length > 0) {
            if (existingSubmission.rows[0].confirmed) {
                return res.status(409).json({
                    success: false,
                    message: "Submission is already confirmed"
                });
            }

            const result = await pool.query(
                `UPDATE submissions
                 SET confirmed = true,
                     confirmed_at = NOW(),
                     updated_at = NOW()
                 WHERE id = $1
                 RETURNING
                    id,
                    assignment_id,
                    group_id,
                    student_id,
                    confirmed,
                    confirmed_at,
                    created_at,
                    updated_at`,
                [existingSubmission.rows[0].id]
            );

            return res.status(200).json({
                success: true,
                message: "Submission confirmed successfully",
                submission: result.rows[0]
            });
        }

        const result = await pool.query(
            `INSERT INTO submissions
                (assignment_id, group_id, student_id, confirmed, confirmed_at)
             VALUES ($1, $2, $3, true, NOW())
             RETURNING
                id,
                assignment_id,
                group_id,
                student_id,
                confirmed,
                confirmed_at,
                created_at,
                updated_at`,
            [assignmentId, groupId, req.user.id]
        );

        return res.status(201).json({
            success: true,
            message: "Submission confirmed successfully",
            submission: result.rows[0]
        });
    } catch (error) {
        console.error("Confirm submission error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


export const getSubmissionStatus = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const result = await pool.query(
            `SELECT
                id,
                assignment_id,
                group_id,
                student_id,
                confirmed,
                confirmed_at,
                created_at,
                updated_at
             FROM submissions
             WHERE assignment_id = $1
               AND student_id = $2`,
            [assignmentId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({
                success: true,
                submitted: false,
                submission: null
            });
        }

        return res.status(200).json({
            success: true,
            submitted: result.rows[0].confirmed,
            submission: result.rows[0]
        });
    } catch (error) {
        console.error("Get submission status error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};