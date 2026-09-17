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
                is_global
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
                   )
                 ORDER BY u.id`,
                [assignmentId]
            );
        }

        const totalStudents = result.rows.length;
        const submittedStudents = result.rows.filter(
            (student) => student.submitted
        ).length;

        const pendingStudents = totalStudents - submittedStudents;

        return res.status(200).json({
            success: true,
            assignment,
            summary: {
                total_students: totalStudents,
                submitted_students: submittedStudents,
                pending_students: pendingStudents
            },
            students: result.rows
        });
    } catch (error) {
        console.error("Get assignment progress error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};