import { Document } from "@langchain/core/documents";
import pool from "../db/connection.js";
import { pineconeIndex } from "./vectorStore.js";
import embeddings from "./embeddings.js";

export const NAMESPACE = "assignments";

export const buildAssignmentText = (assignment) => {
    const lines = [
        `Assignment Title: ${assignment.title}`,
        "",
        "Description:",
        assignment.description || "No description provided",
        "",
        "Due Date:",
        assignment.due_date,
        "",
        "Submission Link:",
        assignment.onedrive_link || "No submission link provided",
        "",
        "Assignment Type:",
        assignment.is_global
            ? "Available to all students"
            : "Assigned to specific students or groups",
        "",
        "Submission Mode:",
        assignment.submission_type === "group"
            ? "Group submission — only the group leader can confirm"
            : "Individual submission — each student confirms their own work"
    ];

    return lines.join("\n").trim();
};

export const indexAssignment = async (assignmentId) => {
    const result = await pool.query(
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

    if (result.rows.length === 0) {
        throw new Error("Assignment not found for AI indexing");
    }

    const assignment = result.rows[0];

    const pageContent = buildAssignmentText(assignment);

    const document = new Document({
        pageContent,
        metadata: {
            assignmentId: assignment.id,
            title: assignment.title
        }
    });

    const embedding = await embeddings.embedQuery(document.pageContent);

    await pineconeIndex.namespace(NAMESPACE).upsert([
        {
            id: `assignment-${assignment.id}`,
            values: embedding,
            metadata: {
                assignmentId: assignment.id,
                title: assignment.title,
                submission_type: assignment.submission_type,
                course_id: assignment.course_id ?? 0,
                text: pageContent
            }
        }
    ]);

    console.log(
        `AI index updated for assignment ${assignment.id} (namespace: ${NAMESPACE})`
    );
};