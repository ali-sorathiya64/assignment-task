import pool from "../db/connection.js";
import { askAssignmentAI, askCourseAI } from "../ai/rag.js";

const canAccessAssignment = async (assignmentId, studentId) => {
    const result = await pool.query(
        `SELECT
            a.id, a.is_global, a.course_id,
            EXISTS (
                SELECT 1 FROM assignment_students ast
                WHERE ast.assignment_id = a.id AND ast.student_id = $2
            ) AS assigned_direct,
            EXISTS (
                SELECT 1 FROM assignment_groups ag
                JOIN group_members gm ON gm.group_id = ag.group_id
                WHERE ag.assignment_id = a.id AND gm.user_id = $2
            ) AS in_assigned_group,
            EXISTS (
                SELECT 1 FROM course_students cs
                WHERE cs.course_id = a.course_id AND cs.student_id = $2
            ) AS enrolled_in_course
         FROM assignments a
         WHERE a.id = $1`,
        [assignmentId, studentId]
    );
    if (result.rows.length === 0) return false;
    const a = result.rows[0];
    return (
        a.is_global ||
        a.assigned_direct ||
        a.in_assigned_group ||
        (a.course_id && a.enrolled_in_course)
    );
};

const canAccessCourse = async (courseId, studentId) => {
    const result = await pool.query(
        `SELECT 1 FROM course_students
         WHERE course_id = $1 AND student_id = $2`,
        [courseId, studentId]
    );
    return result.rows.length > 0;
};

export const chatWithAssignmentAI = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question is required"
            });
        }

        if (!assignmentId || Number.isNaN(Number(assignmentId))) {
            return res.status(400).json({
                success: false,
                message: "Valid assignment ID is required"
            });
        }

        const allowed = await canAccessAssignment(assignmentId, req.user.id);
        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this assignment"
            });
        }

        const result = await askAssignmentAI(question.trim(), assignmentId);

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error("AI assignment chat error:", error);
        return res.status(500).json({
            success: false,
            message: "AI request failed"
        });
    }
};

export const chatWithCourseAI = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question is required"
            });
        }

        if (!courseId || Number.isNaN(Number(courseId))) {
            return res.status(400).json({
                success: false,
                message: "Valid course ID is required"
            });
        }

        const allowed = await canAccessCourse(courseId, req.user.id);
        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this course"
            });
        }

        const result = await askCourseAI(question.trim(), courseId);

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error("AI course chat error:", error);
        return res.status(500).json({
            success: false,
            message: "AI request failed"
        });
    }
};