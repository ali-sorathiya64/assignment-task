import { Document } from "@langchain/core/documents";
import pool from "../db/connection.js";
import { pineconeIndex } from "./vectorStore.js";
import embeddings from "./embeddings.js";

const ingestAssignments = async () => {
    console.log("1. Starting ingestion...");

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

    console.log(`2. PostgreSQL returned ${result.rows.length} assignments`);

    const documents = result.rows.map((assignment) => {
        return new Document({
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
    });

    console.log("3. Generating embeddings...");

    const vectors = [];

    for (const document of documents) {
        const embedding = await embeddings.embedQuery(document.pageContent);

        vectors.push({
            id: `assignment-${document.metadata.assignmentId}`,
            values: embedding,
            metadata: {
                assignmentId: document.metadata.assignmentId,
                title: document.metadata.title,
                text: document.pageContent
            }
        });

        console.log(
            `4. Embedded assignment ${document.metadata.assignmentId}`
        );
    }

    console.log("5. Connecting to Pinecone...");

    const indexStats = await pineconeIndex.describeIndexStats();

    console.log("6. Pinecone connected");
    console.log(indexStats);

    console.log("7. Uploading vectors...");

    await pineconeIndex.upsert(vectors, {
        namespace: "assignments"
    });

    console.log("8. Ingestion completed successfully");
};

ingestAssignments().catch((error) => {
    console.error("Ingestion failed:");
    console.error(error);
    process.exit(1);
});