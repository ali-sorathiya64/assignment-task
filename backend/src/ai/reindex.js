import pool from "../db/connection.js";
import { pineconeIndex } from "./vectorStore.js";
import embeddings from "./embeddings.js";
import { buildAssignmentText, NAMESPACE } from "./indexAssignment.js";

const run = async () => {
    console.log("=== Reindex: full reset ===");

    console.log("1. Deleting existing namespace:", NAMESPACE);
    try {
        await pineconeIndex.namespace(NAMESPACE).deleteAll();
        console.log("   Deleted.");
    } catch (err) {
        console.log("   Skipped (namespace may be empty):", err.message);
    }

    console.log("2. Also deleting default namespace leftovers...");
    try {
        await pineconeIndex.namespace("").deleteAll();
        console.log("   Deleted.");
    } catch (err) {
        console.log("   Skipped:", err.message);
    }

    console.log("3. Loading assignments from PostgreSQL...");
    const result = await pool.query(`
        SELECT
            id,
            title,
            description,
            due_date,
            onedrive_link,
            is_global,
            submission_type,
            course_id
        FROM assignments
        ORDER BY id
    `);

    console.log(`   Found ${result.rows.length} assignments.`);

    if (result.rows.length === 0) {
        console.log("Nothing to index. Exiting.");
        return;
    }

    const vectors = [];

    for (const assignment of result.rows) {
        const text = buildAssignmentText(assignment);
        const embedding = await embeddings.embedQuery(text);

        vectors.push({
            id: `assignment-${assignment.id}`,
            values: embedding,
            metadata: {
                assignmentId: assignment.id,
                title: assignment.title,
                submission_type: assignment.submission_type,
                course_id: assignment.course_id ?? 0,
                text
            }
        });

        console.log(`4. Embedded assignment ${assignment.id}`);
    }

    console.log(`5. Upserting ${vectors.length} vectors to "${NAMESPACE}"...`);
    await pineconeIndex.namespace(NAMESPACE).upsert(vectors);

    console.log("6. Verifying...");
    const stats = await pineconeIndex.describeIndexStats();
    console.log(JSON.stringify(stats, null, 2));

    console.log("=== Reindex complete ===");
};

run().catch((err) => {
    console.error("Reindex failed:");
    console.error(err);
    process.exit(1);
});