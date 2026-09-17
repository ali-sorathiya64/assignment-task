import { askAssignmentAI } from "../ai/rag.js";

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

        const result = await askAssignmentAI(
            question.trim(),
            assignmentId
        );

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error("AI chat error:", error);

        return res.status(500).json({
            success: false,
            message: "AI request failed"
        });
    }
};