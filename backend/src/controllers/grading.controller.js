import pool from "../db/connection.js";

const toId = (value) => {
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) {
        throw { status: 400, message: "Invalid ID" };
    }
    return number;
};

const loadOwnedAssignment = async (assignmentId, professorId) => {
    const result = await pool.query(
        `SELECT a.id, a.title, a.submission_type, a.course_id, a.max_score,
                a.onedrive_link, a.due_date,
                COALESCE(c.professor_id, a.created_by) AS owner_id
         FROM assignments a
         LEFT JOIN courses c ON c.id = a.course_id
         WHERE a.id = $1`,
        [toId(assignmentId)]
    );
    if (result.rows.length === 0) throw { status: 404, message: "Assignment not found" };
    const assignment = result.rows[0];
    if (assignment.owner_id !== professorId) {
        throw { status: 403, message: "You do not own this assignment" };
    }
    if (!assignment.max_score) {
        throw { status: 400, message: "Assignment has no max_score configured" };
    }
    return assignment;
};

const loadSubmission = async (submissionId, client = pool) => {
    const result = await client.query(
        `SELECT id, assignment_id, group_id, student_id, confirmed
         FROM submissions WHERE id = $1`,
        [toId(submissionId)]
    );
    if (result.rows.length === 0) throw { status: 404, message: "Submission not found" };
    return result.rows[0];
};

const validateScore = (raw, max) => {
    if (
        raw === null ||
        raw === undefined ||
        typeof raw === "boolean" ||
        (typeof raw === "string" && raw.trim() === "")
    ) {
        throw { status: 400, message: "Score is required" };
    }
    const score = Number(raw);
    if (!Number.isFinite(score)) throw { status: 400, message: "Score must be a number" };
    if (score < 0) throw { status: 400, message: "Score cannot be negative" };
    if (score > max) throw { status: 400, message: `Score cannot exceed max_score (${max})` };
    if (Math.round(score * 100) / 100 !== score) {
        throw { status: 400, message: "Score can have at most 2 decimal places" };
    }
    return score;
};

export const getGradingDashboard = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.id AS course_id, c.name AS course_name, c.code AS course_code,
                    a.id AS assignment_id, a.title, a.submission_type, a.max_score, a.due_date,
                    (SELECT COUNT(*)::int FROM submissions s
                     WHERE s.assignment_id = a.id AND s.confirmed = true) AS submitted_count,
                    (SELECT COUNT(*)::int FROM grades gr
                     WHERE gr.assignment_id = a.id AND gr.student_id IS NULL) AS group_graded_count,
                    (SELECT COUNT(*)::int FROM grades gr
                     WHERE gr.assignment_id = a.id AND gr.group_id IS NULL) AS individual_graded_count
             FROM courses c
             JOIN assignments a ON a.course_id = c.id
             WHERE c.professor_id = $1
             ORDER BY c.created_at DESC, a.due_date ASC`,
            [req.user.id]
        );
        return res.status(200).json({ success: true, rows: result.rows });
    } catch (error) {
        console.error("Grading dashboard error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getAssignmentSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const assignment = await loadOwnedAssignment(assignmentId, req.user.id);

        if (assignment.submission_type === "group") {
            const result = await pool.query(
                `SELECT g.id AS group_id, g.name AS group_name,
                        s.id AS submission_id, s.confirmed, s.confirmed_at,
                        (SELECT gr.score FROM grades gr
                         WHERE gr.assignment_id = $1 AND gr.group_id = g.id
                           AND gr.student_id IS NULL LIMIT 1) AS common_score,
                        (SELECT gr.feedback FROM grades gr
                         WHERE gr.assignment_id = $1 AND gr.group_id = g.id
                           AND gr.student_id IS NULL LIMIT 1) AS common_feedback,
                        COALESCE(json_agg(json_build_object(
                            'id', u.id, 'name', u.name, 'email', u.email,
                            'override_score', (SELECT gr.score FROM grades gr
                                WHERE gr.assignment_id = $1 AND gr.group_id = g.id
                                  AND gr.student_id = u.id LIMIT 1),
                            'override_feedback', (SELECT gr.feedback FROM grades gr
                                WHERE gr.assignment_id = $1 AND gr.group_id = g.id
                                  AND gr.student_id = u.id LIMIT 1)
                        ) ORDER BY u.id) FILTER (WHERE u.id IS NOT NULL), '[]') AS members
                 FROM assignment_groups ag
                 JOIN groups g ON g.id = ag.group_id
                 LEFT JOIN group_members gm ON gm.group_id = g.id
                 LEFT JOIN users u ON u.id = gm.user_id
                 LEFT JOIN submissions s ON s.assignment_id = $1 AND s.group_id = g.id
                 WHERE ag.assignment_id = $1
                 GROUP BY g.id, s.id, s.confirmed, s.confirmed_at
                 ORDER BY g.name`,
                [assignmentId]
            );
            return res.status(200).json({ success: true, assignment, groups: result.rows });
        }

        const result = await pool.query(
            `SELECT u.id AS student_id, u.name AS student_name, u.email AS student_email,
                    s.id AS submission_id, s.confirmed, s.confirmed_at,
                    gr.score, gr.feedback, gr.graded_at
             FROM users u
             LEFT JOIN submissions s ON s.assignment_id = $1 AND s.student_id = u.id
             LEFT JOIN grades gr ON gr.assignment_id = $1 AND gr.student_id = u.id
                                  AND gr.group_id IS NULL
             WHERE u.role = 'student'
               AND (
                   u.id IN (SELECT student_id FROM assignment_students WHERE assignment_id = $1)
                   OR (COALESCE($2, 0) > 0 AND u.id IN (
                       SELECT student_id FROM course_students WHERE course_id = $2
                   ))
               )
             ORDER BY u.name`,
            [assignmentId, assignment.course_id]
        );
        return res.status(200).json({ success: true, assignment, students: result.rows });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        console.error("Get assignment submissions error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const saveIndividualGrade = async (req, res) => {
    const client = await pool.connect();
    try {
        const { submissionId, score, feedback } = req.body;
        if (!submissionId) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "submissionId is required" });
        }

        await client.query("BEGIN");
        const submission = await loadSubmission(submissionId, client);
        if (!submission.confirmed) {
            await client.query("ROLLBACK");
            return res.status(409).json({ success: false, message: "Submission is not confirmed yet" });
        }
        const assignment = await loadOwnedAssignment(submission.assignment_id, req.user.id);

        if (assignment.submission_type !== "individual") {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Assignment is not individual type" });
        }
        if (!submission.student_id || submission.group_id) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Submission is not an individual submission" });
        }

        const cleanScore = validateScore(score, assignment.max_score);

        const saved = await client.query(
            `INSERT INTO grades
                (assignment_id, submission_id, group_id, student_id, score, feedback, graded_by)
             VALUES ($1, $2, NULL, $3, $4, $5, $6)
             ON CONFLICT (assignment_id, student_id) WHERE group_id IS NULL
             DO UPDATE SET submission_id = EXCLUDED.submission_id,
                           score = EXCLUDED.score,
                           feedback = EXCLUDED.feedback,
                           graded_by = EXCLUDED.graded_by,
                           updated_at = NOW()
             RETURNING *`,
            [submission.assignment_id, submission.id, submission.student_id,
             cleanScore, feedback?.trim() || null, req.user.id]
        );

        await client.query("COMMIT");
        return res.status(200).json({ success: true, message: "Grade saved", grade: saved.rows[0] });
    } catch (error) {
        try { await client.query("ROLLBACK"); } catch (_) {}
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        console.error("Save individual grade error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    } finally {
        client.release();
    }
};

export const saveGroupCommonGrade = async (req, res) => {
    const client = await pool.connect();
    try {
        const { groupId, submissionId, score, feedback } = req.body;
        if (!groupId || !submissionId) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "groupId and submissionId are required" });
        }

        await client.query("BEGIN");
        const submission = await loadSubmission(submissionId, client);
        if (!submission.confirmed) {
            await client.query("ROLLBACK");
            return res.status(409).json({ success: false, message: "Submission is not confirmed yet" });
        }
        if (submission.group_id !== Number(groupId)) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Submission does not belong to this group" });
        }

        const assignment = await loadOwnedAssignment(submission.assignment_id, req.user.id);
        if (assignment.submission_type !== "group") {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Assignment is not group type" });
        }

        const cleanScore = validateScore(score, assignment.max_score);

        const saved = await client.query(
            `INSERT INTO grades
                (assignment_id, submission_id, group_id, student_id, score, feedback, graded_by)
             VALUES ($1, $2, $3, NULL, $4, $5, $6)
             ON CONFLICT (assignment_id, group_id) WHERE student_id IS NULL
             DO UPDATE SET submission_id = EXCLUDED.submission_id,
                           score = EXCLUDED.score,
                           feedback = EXCLUDED.feedback,
                           graded_by = EXCLUDED.graded_by,
                           updated_at = NOW()
             RETURNING *`,
            [submission.assignment_id, submission.id, Number(groupId),
             cleanScore, feedback?.trim() || null, req.user.id]
        );

        await client.query("COMMIT");
        return res.status(200).json({ success: true, message: "Group grade saved", grade: saved.rows[0] });
    } catch (error) {
        try { await client.query("ROLLBACK"); } catch (_) {}
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        console.error("Save group common grade error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    } finally {
        client.release();
    }
};

export const saveGroupOverride = async (req, res) => {
    const client = await pool.connect();
    try {
        const { groupId, studentId, submissionId, score, feedback } = req.body;
        if (!groupId || !studentId || !submissionId) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "groupId, studentId and submissionId are required"
            });
        }

        await client.query("BEGIN");
        const submission = await loadSubmission(submissionId, client);
        if (!submission.confirmed) {
            await client.query("ROLLBACK");
            return res.status(409).json({ success: false, message: "Submission is not confirmed yet" });
        }
        if (submission.group_id !== Number(groupId)) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Submission does not belong to this group" });
        }

        const member = await client.query(
            `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
            [Number(groupId), Number(studentId)]
        );
        if (member.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Student is not a member of this group" });
        }

        const assignment = await loadOwnedAssignment(submission.assignment_id, req.user.id);
        if (assignment.submission_type !== "group") {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Assignment is not group type" });
        }

        const cleanScore = validateScore(score, assignment.max_score);

        const saved = await client.query(
            `INSERT INTO grades
                (assignment_id, submission_id, group_id, student_id, score, feedback, graded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (assignment_id, group_id, student_id) WHERE student_id IS NOT NULL
             DO UPDATE SET submission_id = EXCLUDED.submission_id,
                           score = EXCLUDED.score,
                           feedback = EXCLUDED.feedback,
                           graded_by = EXCLUDED.graded_by,
                           updated_at = NOW()
             RETURNING *`,
            [submission.assignment_id, submission.id, Number(groupId), Number(studentId),
             cleanScore, feedback?.trim() || null, req.user.id]
        );

        await client.query("COMMIT");
        return res.status(200).json({ success: true, message: "Override saved", grade: saved.rows[0] });
    } catch (error) {
        try { await client.query("ROLLBACK"); } catch (_) {}
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        console.error("Save group override error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    } finally {
        client.release();
    }
};

export const removeGroupOverride = async (req, res) => {
    try {
        const submission = await loadSubmission(req.params.submissionId);
        await loadOwnedAssignment(submission.assignment_id, req.user.id);
        const result = await pool.query(
            `DELETE FROM grades
             WHERE submission_id = $1 AND student_id = $2 AND group_id IS NOT NULL
             RETURNING id`,
            [submission.id, toId(req.params.studentId)]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Override not found" });
        }
        return res.status(200).json({ success: true, message: "Override removed" });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        console.error("Remove override error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getMyGrades = async (req, res) => {
    try {
        const studentId = req.user.id;

        const rows = await pool.query(
            `WITH my_assignments AS (
                SELECT DISTINCT a.id
                FROM assignments a
                WHERE a.is_global = true
                   OR EXISTS (SELECT 1 FROM assignment_students ast
                              WHERE ast.assignment_id = a.id AND ast.student_id = $1)
                   OR EXISTS (SELECT 1 FROM assignment_groups ag
                              JOIN group_members gm ON gm.group_id = ag.group_id
                              WHERE ag.assignment_id = a.id AND gm.user_id = $1)
                   OR a.course_id IN (SELECT cs.course_id FROM course_students cs
                                      WHERE cs.student_id = $1)
             )
             SELECT
                 a.id AS assignment_id,
                 a.title,
                 a.max_score,
                 a.submission_type,
                 a.course_id,
                 c.code AS course_code,
                 c.name AS course_name,
                 CASE
                     WHEN a.submission_type = 'individual' THEN (
                         SELECT gr.score FROM grades gr
                         WHERE gr.assignment_id = a.id
                           AND gr.student_id = $1
                           AND gr.group_id IS NULL
                         LIMIT 1
                     )
                     ELSE COALESCE(
                         (SELECT gr.score FROM grades gr
                          JOIN group_members gm ON gm.group_id = gr.group_id
                          WHERE gr.assignment_id = a.id
                            AND gr.student_id = $1
                            AND gr.group_id IS NOT NULL
                          LIMIT 1),
                         (SELECT gr.score FROM grades gr
                          JOIN group_members gm ON gm.group_id = gr.group_id
                          WHERE gr.assignment_id = a.id
                            AND gr.student_id IS NULL
                            AND gr.group_id IS NOT NULL
                            AND gm.user_id = $1
                          LIMIT 1)
                     )
                 END AS score,
                 CASE
                     WHEN a.submission_type = 'individual' THEN (
                         SELECT gr.feedback FROM grades gr
                         WHERE gr.assignment_id = a.id
                           AND gr.student_id = $1
                           AND gr.group_id IS NULL
                         LIMIT 1
                     )
                     ELSE COALESCE(
                         (SELECT gr.feedback FROM grades gr
                          JOIN group_members gm ON gm.group_id = gr.group_id
                          WHERE gr.assignment_id = a.id
                            AND gr.student_id = $1
                            AND gr.group_id IS NOT NULL
                          LIMIT 1),
                         (SELECT gr.feedback FROM grades gr
                          JOIN group_members gm ON gm.group_id = gr.group_id
                          WHERE gr.assignment_id = a.id
                            AND gr.student_id IS NULL
                            AND gr.group_id IS NOT NULL
                            AND gm.user_id = $1
                          LIMIT 1)
                     )
                 END AS feedback,
                 EXISTS (
                     SELECT 1 FROM grades gr
                     JOIN group_members gm ON gm.group_id = gr.group_id
                     WHERE gr.assignment_id = a.id
                       AND gr.student_id = $1
                       AND gr.group_id IS NOT NULL
                 ) AS has_override
             FROM assignments a
             LEFT JOIN courses c ON c.id = a.course_id
             WHERE a.id IN (SELECT id FROM my_assignments)
             ORDER BY a.due_date DESC`,
            [studentId]
        );

        return res.status(200).json({ success: true, grades: rows.rows });
    } catch (error) {
        console.error("Get my grades error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};