import pool from "../db/connection.js";

export const getAllStudents = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                name,
                email,
                created_at
             FROM users
             WHERE role = 'student'
             ORDER BY id`
        );

        return res.status(200).json({
            success: true,
            students: result.rows
        });
    } catch (error) {
        console.error("Get all students error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};