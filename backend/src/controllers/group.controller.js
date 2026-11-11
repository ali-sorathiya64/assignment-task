import pool from "../db/connection.js";

export const createGroup = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Group name is required"
            });
        }

        const existingGroup = await pool.query(
            `SELECT g.id
             FROM groups g
             JOIN group_members gm ON gm.group_id = g.id
             WHERE gm.user_id = $1 AND LOWER(g.name) = LOWER($2)`,
            [req.user.id, name.trim()]
        );

        if (existingGroup.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "You already have a group with this name"
            });
        }

        const groupResult = await pool.query(
            `INSERT INTO groups (name, created_by, leader_id)
             VALUES ($1, $2, $2)
             RETURNING id, name, created_by, leader_id, created_at`,
            [name.trim(), req.user.id]
        );

        const group = groupResult.rows[0];

        await pool.query(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1, $2)`,
            [group.id, req.user.id]
        );

        return res.status(201).json({
            success: true,
            message: "Group created successfully",
            group
        });
    } catch (error) {
        console.error("Create group error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const addMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { email, studentId } = req.body;

        if (!email && !studentId) {
            return res.status(400).json({
                success: false,
                message: "Student email or student ID is required"
            });
        }

        const groupResult = await pool.query(
            `SELECT id, name, leader_id FROM groups WHERE id = $1`,
            [groupId]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        const group = groupResult.rows[0];

        if (group.leader_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only the group leader can add members"
            });
        }

        const hasConfirmedSubmission = await pool.query(
            `SELECT 1 FROM submissions
             WHERE group_id = $1 AND confirmed = true LIMIT 1`,
            [groupId]
        );

        if (hasConfirmedSubmission.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Cannot add members after the group submission is confirmed"
            });
        }

        let studentResult;

        if (studentId) {
            studentResult = await pool.query(
                `SELECT id, name, email, role FROM users
                 WHERE id = $1 AND role = 'student'`,
                [studentId]
            );
        } else {
            studentResult = await pool.query(
                `SELECT id, name, email, role FROM users
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

        const existingMember = await pool.query(
            `SELECT id FROM group_members
             WHERE group_id = $1 AND user_id = $2`,
            [groupId, student.id]
        );

        if (existingMember.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Student is already a member of this group"
            });
        }

        const groupAssignments = await pool.query(
            `SELECT a.id AS assignment_id, a.course_id
             FROM assignment_groups ag
             JOIN assignments a ON a.id = ag.assignment_id
             WHERE ag.group_id = $1 AND a.course_id IS NOT NULL`,
            [groupId]
        );

        for (const row of groupAssignments.rows) {
            const enrolled = await pool.query(
                `SELECT 1 FROM course_students
                 WHERE course_id = $1 AND student_id = $2`,
                [row.course_id, student.id]
            );
            if (enrolled.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This student is not enrolled in the course for one of this group's assignments"
                });
            }
        }

        const conflict = await pool.query(
            `SELECT DISTINCT ag2.assignment_id
             FROM assignment_groups ag1
             JOIN assignment_groups ag2 ON ag2.assignment_id = ag1.assignment_id
             JOIN group_members gm ON gm.group_id = ag2.group_id
             WHERE ag1.group_id = $1
               AND ag2.group_id <> $1
               AND gm.user_id = $2`,
            [groupId, student.id]
        );

        if (conflict.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This student is already in another group for one of this group's assignments"
            });
        }

        await pool.query(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1, $2)`,
            [groupId, student.id]
        );

        return res.status(201).json({
            success: true,
            message: "Student added to group successfully",
            student
        });
    } catch (error) {
        console.error("Add member error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getMyGroups = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                g.id,
                g.name,
                g.created_by,
                g.leader_id,
                g.created_at,
                leader.name AS leader_name,
                leader.email AS leader_email,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', u.id,
                            'name', u.name,
                            'email', u.email,
                            'role', u.role,
                            'is_leader', (u.id = g.leader_id)
                        )
                        ORDER BY u.id
                    ) FILTER (WHERE u.id IS NOT NULL),
                    '[]'
                ) AS members
             FROM groups g
             JOIN group_members gm ON gm.group_id = g.id
             LEFT JOIN group_members gm2 ON gm2.group_id = g.id
             LEFT JOIN users u ON u.id = gm2.user_id
             LEFT JOIN users leader ON leader.id = g.leader_id
             WHERE gm.user_id = $1
             GROUP BY g.id, leader.name, leader.email
             ORDER BY g.created_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            groups: result.rows
        });
    } catch (error) {
        console.error("Get groups error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getAllGroups = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                g.id,
                g.name,
                g.created_by,
                g.leader_id,
                g.created_at,
                leader.name AS leader_name,
                leader.email AS leader_email,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', u.id,
                            'name', u.name,
                            'email', u.email,
                            'is_leader', (u.id = g.leader_id)
                        )
                        ORDER BY u.id
                    ) FILTER (WHERE u.id IS NOT NULL),
                    '[]'
                ) AS members
             FROM groups g
             LEFT JOIN group_members gm ON gm.group_id = g.id
             LEFT JOIN users u ON u.id = gm.user_id
             LEFT JOIN users leader ON leader.id = g.leader_id
             GROUP BY g.id, leader.name, leader.email
             ORDER BY g.created_at DESC`
        );

        return res.status(200).json({
            success: true,
            groups: result.rows
        });
    } catch (error) {
        console.error("Get all groups error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Group name is required"
            });
        }

        const groupCheck = await pool.query(
            `SELECT id, leader_id, created_by FROM groups WHERE id = $1`,
            [groupId]
        );

        if (groupCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        const group = groupCheck.rows[0];

        if (group.leader_id !== req.user.id && group.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only the group leader can edit this group"
            });
        }

        const result = await pool.query(
            `UPDATE groups SET name = $1 WHERE id = $2
             RETURNING id, name, created_by, leader_id, created_at`,
            [name.trim(), groupId]
        );

        return res.status(200).json({
            success: true,
            message: "Group updated",
            group: result.rows[0]
        });
    } catch (error) {
        console.error("Update group error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        const groupCheck = await pool.query(
            `SELECT id, leader_id FROM groups WHERE id = $1`,
            [groupId]
        );

        if (groupCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        const group = groupCheck.rows[0];

        if (group.leader_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only the group leader can remove members"
            });
        }

        if (Number(userId) === group.leader_id) {
            return res.status(400).json({
                success: false,
                message: "The group leader cannot remove themselves"
            });
        }

        const hasGroupSubmission = await pool.query(
            `SELECT 1 FROM submissions
             WHERE group_id = $1 AND confirmed = true LIMIT 1`,
            [groupId]
        );

        if (hasGroupSubmission.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Cannot remove members after the group submission is confirmed"
            });
        }

        const result = await pool.query(
            `DELETE FROM group_members
             WHERE group_id = $1 AND user_id = $2
             RETURNING id`,
            [groupId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Member not found in this group"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Member removed from group"
        });
    } catch (error) {
        console.error("Remove member error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        const groupCheck = await pool.query(
            `SELECT id, leader_id FROM groups WHERE id = $1`,
            [groupId]
        );

        if (groupCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        const group = groupCheck.rows[0];

        if (group.leader_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only the group leader can delete this group"
            });
        }

        const assigned = await pool.query(
            `SELECT 1 FROM assignment_groups WHERE group_id = $1 LIMIT 1`,
            [groupId]
        );

        if (assigned.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete a group that has received assignments"
            });
        }

        const hasSubmissions = await pool.query(
            `SELECT 1 FROM submissions WHERE group_id = $1 LIMIT 1`,
            [groupId]
        );

        if (hasSubmissions.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete a group that has submissions or grades"
            });
        }

        await pool.query(`DELETE FROM groups WHERE id = $1`, [groupId]);

        return res.status(200).json({
            success: true,
            message: "Group deleted"
        });
    } catch (error) {
        console.error("Delete group error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};