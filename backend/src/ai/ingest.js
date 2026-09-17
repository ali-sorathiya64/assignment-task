import { Document } from "@langchain/core/documents";
import pool from "../db/connection.js";
import vectorStore from "./vectorStore.js";

export const ingestAssignments = async () => {
    const result = await pool.query(`
        SELECT
            id,
            title,
            description,
            due_date,
            onedrive_link,
            is_global
        FROM assignments
        ORDER BY id
    `);

    if (result.rows.length === 0) {
        console.log("No assignments found to ingest");
        return;
    }

    const documents = result.rows.map((assignment) => {
        const content = `
Assignment Title: ${assignment.title}

Description:
${assignment.description || "No description provided"}

Due Date:
${assignment.due_date}

Submission Link:
${assignment.onedrive_link || "No submission link provided"}

Assignment Type:
${assignment.is_global ? "Available to all students" : "Assigned to specific students or groups"}
        `.trim();

        return new Document({
            pageContent: content,
            metadata: {
                assignmentId: assignment.id,
                title: assignment.title
            }
        });
    });

    await vectorStore.addDocuments(documents);

    console.log(
        `Successfully ingested ${documents.length} assignments into Pinecone`
    );
};

ingestAssignments().catch((error) => {
    console.error("Ingestion failed:", error);
});