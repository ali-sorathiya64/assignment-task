import pool from "../db/connection.js";
import { pineconeIndex } from "./vectorStore.js";
import embeddings from "./embeddings.js";
import { buildAssignmentText, NAMESPACE } from "./indexAssignment.js";
import { buildCourseText, COURSE_NAMESPACE } from "./indexCourse.js";

const resetNamespace = async (namespace) => {
    try {
        await pineconeIndex.namespace(namespace).deleteAll();
        console.log(`   Deleted namespace "${namespace}".`);
    } catch (err) {
        console.log(`   Skipped "${namespace}": ${err.message}`);
    }
};

const run = async () => {
    console.log("=== Reindex: full reset ===");

    console.log("1. Deleting namespaces...");
    await resetNamespace(NAMESPACE);
    await resetNamespace(COURSE_NAMESPACE);
    await resetNamespace("");

    console.log("2. Indexing assignments...");
    const assignmentResult = await pool.query(`
        SELECT
            id, title, description, due_date, onedrive_link,
            is_global, submission_type, course_id
        FROM assignments
        ORDER BY id
    `);

    const assignmentVectors = [];

    for (const assignment of assignmentResult.rows) {
        const text = buildAssignmentText(assignment);
        const embedding = await embeddings.embedQuery(text);

        assignmentVectors.push({
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

        console.log(`   Embedded assignment ${assignment.id}`);
    }

    if (assignmentVectors.length > 0) {
        console.log(
            `   Upserting ${assignmentVectors.length} assignment vectors...`
        );
        await pineconeIndex
            .namespace(NAMESPACE)
            .upsert(assignmentVectors);
    }

    console.log("3. Indexing courses...");
    const courseResult = await pool.query(`
        SELECT
            c.id,
            c.name,
            c.code,
            c.description,
            u.name AS professor_name,
            (SELECT COUNT(*)::int FROM course_students cs WHERE cs.course_id = c.id) AS student_count,
            (SELECT COUNT(*)::int FROM assignments a WHERE a.course_id = c.id) AS assignment_count
        FROM courses c
        JOIN users u ON u.id = c.professor_id
        ORDER BY c.id
    `);

    const courseVectors = [];

    for (const course of courseResult.rows) {
        const text = buildCourseText(course);
        const embedding = await embeddings.embedQuery(text);

        courseVectors.push({
            id: `course-${course.id}`,
            values: embedding,
            metadata: {
                courseId: course.id,
                title: course.name,
                code: course.code,
                text
            }
        });

        console.log(`   Embedded course ${course.id}`);
    }

    if (courseVectors.length > 0) {
        console.log(
            `   Upserting ${courseVectors.length} course vectors...`
        );
        await pineconeIndex.namespace(COURSE_NAMESPACE).upsert(courseVectors);
    }

    console.log("4. Verifying...");
    const stats = await pineconeIndex.describeIndexStats();
    console.log(JSON.stringify(stats, null, 2));

    console.log("=== Reindex complete ===");
};

run().catch((err) => {
    console.error("Reindex failed:");
    console.error(err);
    process.exit(1);
});