import pool from "../db/connection.js";

export const getAssignmentProgress = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignmentResult = await pool.query(
            `SELECT
                id,
                title,
                description,
                due_date,
                onedrive_link,
                is_global,
                submission_type,
                course_id
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

        let result;

        if (assignment.is_global) {
            result = await pool.query(
                `SELECT
                    u.id AS student_id,
                    u.name AS student_name,
                    u.email AS student_email,
                    gm.group_id,
                    g.name AS group_name,
                    g.leader_id,
                    COALESCE(s.confirmed, false) AS submitted,
                    s.confirmed_at
                 FROM users u
                 LEFT JOIN group_members gm
                    ON gm.user_id = u.id
                 LEFT JOIN groups g
                    ON g.id = gm.group_id
                 LEFT JOIN submissions s
                    ON s.assignment_id = $1
                    AND s.student_id = u.id
                 WHERE u.role = 'student'
                 ORDER BY u.id`,
                [assignmentId]
            );
        } else {
            result = await pool.query(
                `SELECT DISTINCT
                    u.id AS student_id,
                    u.name AS student_name,
                    u.email AS student_email,
                    g.id AS group_id,
                    g.name AS group_name,
                    g.leader_id,
                    COALESCE(s.confirmed, false) AS submitted,
                    s.confirmed_at
                 FROM users u
                 LEFT JOIN group_members gm
                    ON gm.user_id = u.id
                 LEFT JOIN groups g
                    ON g.id = gm.group_id
                 LEFT JOIN submissions s
                    ON s.assignment_id = $1
                    AND s.student_id = u.id
                 WHERE u.role = 'student'
                   AND (
                        EXISTS (
                            SELECT 1
                            FROM assignment_students ast
                            WHERE ast.assignment_id = $1
                              AND ast.student_id = u.id
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM assignment_groups ag
                            JOIN group_members agm
                                ON agm.group_id = ag.group_id
                            WHERE ag.assignment_id = $1
                              AND agm.user_id = u.id
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM course_students cs
                            WHERE cs.course_id = $2
                              AND cs.student_id = u.id
                        )
                   )
                 ORDER BY u.id`,
                [assignmentId, assignment.course_id]
            );
        }

        let students = result.rows;

        if (assignment.submission_type === "group") {
            const groupSubs = await pool.query(
                `SELECT group_id, confirmed, confirmed_at
                 FROM submissions
                 WHERE assignment_id = $1
                   AND group_id IS NOT NULL`,
                [assignmentId]
            );

            const byGroup = new Map();

            for (const row of groupSubs.rows) {
                byGroup.set(row.group_id, {
                    confirmed: row.confirmed,
                    confirmed_at: row.confirmed_at
                });
            }

            students = result.rows.map((row) => {
                if (!row.group_id) {
                    return row;
                }

                const groupStatus = byGroup.get(row.group_id);

                if (groupStatus && groupStatus.confirmed) {
                    return {
                        ...row,
                        submitted: true,
                        confirmed_at:
                            row.confirmed_at || groupStatus.confirmed_at
                    };
                }

                return row;
            });
        }

        const totalStudents = students.length;
        const submittedStudents = students.filter((s) => s.submitted).length;
        const pendingStudents = totalStudents - submittedStudents;

        return res.status(200).json({
            success: true,
            assignment,
            summary: {
                total_students: totalStudents,
                submitted_students: submittedStudents,
                pending_students: pendingStudents
            },
            students
        });
    } catch (error) {
        console.error("Get assignment progress error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};