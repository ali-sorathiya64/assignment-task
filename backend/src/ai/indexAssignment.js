import { Document } from "@langchain/core/documents";
import pool from "../db/connection.js";
import { pineconeIndex } from "./vectorStore.js";
import embeddings from "./embeddings.js";

export const indexAssignment = async (assignmentId) => {
    const result = await pool.query(
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

    if (result.rows.length === 0) {
        throw new Error("Assignment not found for AI indexing");
    }

    const assignment = result.rows[0];

    const document = new Document({
        pageContent: `
Assignment Title: ${assignment.title}

Description:
${assignment.description || "No description provided"}

Due Date:
${assignment.due_date}

Submission Link:
${assignment.onedrive_link || "No submission link provided"}

Assignment Type:
${assignment.is_global ? "Available to all students" : "Assigned to specific students or groups"}
        `.trim(),
        metadata: {
            assignmentId: assignment.id,
            title: assignment.title
        }
    });

    const embedding = await embeddings.embedQuery(document.pageContent);

    await pineconeIndex.upsert([
        {
            id: `assignment-${assignment.id}`,
            values: embedding,
            metadata: {
                assignmentId: assignment.id,
                title: assignment.title,
                text: document.pageContent
            }
        }
    ]);

    console.log(`AI index updated for assignment ${assignment.id}`);
};