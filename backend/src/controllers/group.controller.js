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

        const memberResult = await pool.query(
            `SELECT id
             FROM group_members
             WHERE group_id = $1 AND user_id = $2`,
            [groupId, req.user.id]
        );

        if (memberResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        let studentResult;

        if (studentId) {
            studentResult = await pool.query(
                `SELECT id, name, email, role
                 FROM users
                 WHERE id = $1 AND role = 'student'`,
                [studentId]
            );
        } else {
            studentResult = await pool.query(
                `SELECT id, name, email, role
                 FROM users
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
            `SELECT id
             FROM group_members
             WHERE group_id = $1 AND user_id = $2`,
            [groupId, student.id]
        );

        if (existingMember.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Student is already a member of this group"
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
             LEFT JOIN group_members gm
                ON gm.group_id = g.id
             LEFT JOIN users u
                ON u.id = gm.user_id
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