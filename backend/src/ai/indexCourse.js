import pool from "../db/connection.js";
import { pineconeIndex } from "./vectorStore.js";
import embeddings from "./embeddings.js";

export const COURSE_NAMESPACE = "courses";

export const buildCourseText = (course) => {
    const lines = [
        `Course Name: ${course.name}`,
        "",
        "Course Code:",
        course.code,
        "",
        "Description:",
        course.description || "No description provided",
        "",
        "Professor:",
        course.professor_name || "Not specified",
        "",
        "Enrollment:",
        `${course.student_count} students enrolled`,
        "",
        "Assignments:",
        `${course.assignment_count} assignments in this course`
    ];

    return lines.join("\n").trim();
};

export const indexCourse = async (courseId) => {
    const result = await pool.query(
        `SELECT
            c.id,
            c.name,
            c.code,
            c.description,
            u.name AS professor_name,
            (SELECT COUNT(*)::int FROM course_students cs WHERE cs.course_id = c.id) AS student_count,
            (SELECT COUNT(*)::int FROM assignments a WHERE a.course_id = c.id) AS assignment_count
         FROM courses c
         JOIN users u ON u.id = c.professor_id
         WHERE c.id = $1`,
        [courseId]
    );

    if (result.rows.length === 0) {
        throw new Error("Course not found for AI indexing");
    }

    const course = result.rows[0];
    const pageContent = buildCourseText(course);
    const embedding = await embeddings.embedQuery(pageContent);

    await pineconeIndex.namespace(COURSE_NAMESPACE).upsert([
        {
            id: `course-${course.id}`,
            values: embedding,
            metadata: {
                courseId: course.id,
                title: course.name,
                code: course.code,
                text: pageContent
            }
        }
    ]);

    console.log(
        `AI index updated for course ${course.id} (namespace: ${COURSE_NAMESPACE})`
    );
};