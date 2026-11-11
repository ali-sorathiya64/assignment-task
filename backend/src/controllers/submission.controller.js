import pool from "../db/connection.js";

export const confirmSubmission = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignmentResult = await pool.query(
            `SELECT id, is_global, submission_type, course_id
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
        const isGroupAssignment = assignment.submission_type === "group";

        const groupResult = await pool.query(
            `SELECT DISTINCT g.id AS group_id, g.leader_id, g.name AS group_name
             FROM groups g
             JOIN group_members gm ON gm.group_id = g.id
             LEFT JOIN assignment_groups ag
                ON ag.group_id = g.id AND ag.assignment_id = $1
             WHERE gm.user_id = $2
               AND (
                   ag.id IS NOT NULL
                   OR (
                       COALESCE($3, 0) > 0
                       AND EXISTS (
                           SELECT 1 FROM course_students cs
                           WHERE cs.course_id = $3 AND cs.student_id = $2
                       )
                   )
               )
             LIMIT 1`,
            [assignmentId, req.user.id, assignment.course_id]
        );

        const studentAssignmentResult = await pool.query(
            `SELECT id
             FROM assignment_students
             WHERE assignment_id = $1
               AND student_id = $2`,
            [assignmentId, req.user.id]
        );

        let courseEnrollmentResult = { rows: [] };

        if (assignment.course_id) {
            courseEnrollmentResult = await pool.query(
                `SELECT id
                 FROM course_students
                 WHERE course_id = $1
                   AND student_id = $2`,
                [assignment.course_id, req.user.id]
            );
        }

        const hasAccess =
            assignment.is_global ||
            groupResult.rows.length > 0 ||
            studentAssignmentResult.rows.length > 0 ||
            courseEnrollmentResult.rows.length > 0;

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "This assignment is not assigned to you"
            });
        }

        if (isGroupAssignment) {
            if (groupResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This is a group assignment, but you are not in a group that received it"
                });
            }

            const groupRow = groupResult.rows[0];
            const groupId = groupRow.group_id;
            const leaderId = groupRow.leader_id;
            const groupName = groupRow.group_name;

            if (leaderId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: `Only the group leader can confirm this submission for "${groupName}"`
                });
            }

            const existing = await pool.query(
                `SELECT id, confirmed
                 FROM submissions
                 WHERE assignment_id = $1
                   AND group_id = $2`,
                [assignmentId, groupId]
            );

            if (existing.rows.length > 0) {
                if (existing.rows[0].confirmed) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "Your group has already confirmed this submission"
                    });
                }

                const updated = await pool.query(
                    `UPDATE submissions
                     SET confirmed = true,
                         confirmed_at = NOW(),
                         confirmed_by = $1,
                         updated_at = NOW()
                     WHERE id = $2
                     RETURNING
                        id,
                        assignment_id,
                        group_id,
                        student_id,
                        confirmed,
                        confirmed_by,
                        confirmed_at,
                        created_at,
                        updated_at`,
                    [req.user.id, existing.rows[0].id]
                );

                return res.status(200).json({
                    success: true,
                    message:
                        "Group submission confirmed — all members are marked as submitted",
                    submission: updated.rows[0]
                });
            }

            const created = await pool.query(
                `INSERT INTO submissions
                    (assignment_id, group_id, student_id,
                     confirmed, confirmed_by, confirmed_at)
                 VALUES ($1, $2, $3, true, $3, NOW())
                 RETURNING
                    id,
                    assignment_id,
                    group_id,
                    student_id,
                    confirmed,
                    confirmed_by,
                    confirmed_at,
                    created_at,
                    updated_at`,
                [assignmentId, groupId, req.user.id]
            );

            return res.status(201).json({
                success: true,
                message:
                    "Group submission confirmed — all members are marked as submitted",
                submission: created.rows[0]
            });
        }

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
                     confirmed_by = $1,
                     updated_at = NOW()
                 WHERE id = $2
                 RETURNING
                    id,
                    assignment_id,
                    group_id,
                    student_id,
                    confirmed,
                    confirmed_by,
                    confirmed_at,
                    created_at,
                    updated_at`,
                [req.user.id, existingSubmission.rows[0].id]
            );

            return res.status(200).json({
                success: true,
                message: "Submission confirmed successfully",
                submission: result.rows[0]
            });
        }

        const result = await pool.query(
            `INSERT INTO submissions
                (assignment_id, group_id, student_id,
                 confirmed, confirmed_by, confirmed_at)
             VALUES ($1, NULL, $2, true, $2, NOW())
             RETURNING
                id,
                assignment_id,
                group_id,
                student_id,
                confirmed,
                confirmed_by,
                confirmed_at,
                created_at,
                updated_at`,
            [assignmentId, req.user.id]
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

        const assignmentResult = await pool.query(
            `SELECT id, submission_type, course_id
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
        const isGroupAssignment = assignment.submission_type === "group";

        if (!isGroupAssignment) {
            const result = await pool.query(
                `SELECT
                    id,
                    assignment_id,
                    group_id,
                    student_id,
                    confirmed,
                    confirmed_by,
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
                    is_group_assignment: false,
                    is_leader: false,
                    can_confirm: true,
                    submission: null
                });
            }

            const submission = result.rows[0];

            return res.status(200).json({
                success: true,
                submitted: submission.confirmed,
                is_group_assignment: false,
                is_leader: false,
                can_confirm: !submission.confirmed,
                submission
            });
        }

        const groupResult = await pool.query(
            `SELECT DISTINCT
                g.id AS group_id,
                g.name AS group_name,
                g.leader_id,
                leader.name AS leader_name,
                (g.leader_id = $1) AS is_leader
             FROM groups g
             JOIN group_members gm ON gm.group_id = g.id
             LEFT JOIN users leader ON leader.id = g.leader_id
             LEFT JOIN assignment_groups ag
                ON ag.group_id = g.id AND ag.assignment_id = $2
             WHERE gm.user_id = $1
               AND (
                   ag.id IS NOT NULL
                   OR (
                       COALESCE($3, 0) > 0
                       AND EXISTS (
                           SELECT 1 FROM course_students cs
                           WHERE cs.course_id = $3 AND cs.student_id = $1
                       )
                   )
               )
             ORDER BY g.id
             LIMIT 1`,
            [req.user.id, assignmentId, assignment.course_id]
        );

        if (groupResult.rows.length === 0) {
            return res.status(200).json({
                success: true,
                submitted: false,
                is_group_assignment: true,
                is_leader: false,
                can_confirm: false,
                message:
                    "You are not in a group that received this assignment",
                submission: null
            });
        }

        const groupRow = groupResult.rows[0];

        const submissionResult = await pool.query(
            `SELECT
                id,
                assignment_id,
                group_id,
                student_id,
                confirmed,
                confirmed_by,
                confirmed_at,
                created_at,
                updated_at
             FROM submissions
             WHERE assignment_id = $1
               AND group_id = $2`,
            [assignmentId, groupRow.group_id]
        );

        const submission = submissionResult.rows[0] || null;
        const submitted = Boolean(submission && submission.confirmed);

        return res.status(200).json({
            success: true,
            submitted,
            is_group_assignment: true,
            is_leader: groupRow.is_leader,
            can_confirm: groupRow.is_leader && !submitted,
            group: {
                id: groupRow.group_id,
                name: groupRow.group_name,
                leader_name: groupRow.leader_name
            },
            submission
        });
    } catch (error) {
        console.error("Get submission status error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};