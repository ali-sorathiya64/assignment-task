import { ChatOpenAI } from "@langchain/openai";
import embeddings from "./embeddings.js";
import pineconeIndex from "./vectorStore.js";
import { NAMESPACE } from "./indexAssignment.js";
import { COURSE_NAMESPACE } from "./indexCourse.js";

const llm = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL,
    temperature: 0.2,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1"
    }
});

const SCORE_THRESHOLD = 0.1;
const TOP_K = 8;

const queryNamespace = async (namespace, question, filter) => {
    const embedding = await embeddings.embedQuery(question);

    const result = await pineconeIndex.namespace(namespace).query({
        vector: embedding,
        topK: TOP_K,
        includeMetadata: true,
        filter
    });

    return (result.matches || []).filter(
        (m) => (m.score ?? 0) >= SCORE_THRESHOLD
    );
};

const buildPrompt = (context, question, scope) => `
You are an AI assistant for a student assignment management system.

The student is asking about a specific ${scope}. Below is all the information we have.

RULES:
1. Answer using ONLY the information below.
2. If the answer is genuinely NOT present below, respond with exactly:
   "I don't have that information."
3. Do not invent details.
4. Keep answers short — 1 to 3 sentences unless the student asks for detail.

${scope.toUpperCase()} INFORMATION:
${context}

STUDENT QUESTION:
${question}

ANSWER:
`.trim();

export const askAssignmentAI = async (question, assignmentId) => {
    const matches = await queryNamespace(NAMESPACE, question, {
        assignmentId: { $eq: Number(assignmentId) }
    });

    if (matches.length === 0) {
        return {
            answer: "I don't have that information for this assignment.",
            sources: []
        };
    }

    const context = matches
        .map((m) => m.metadata?.text || "")
        .filter(Boolean)
        .join("\n\n---\n\n");

    const response = await llm.invoke(
        buildPrompt(context, question, "assignment")
    );

    return {
        answer: response.content,
        sources: matches.map((m) => ({
            assignmentId: m.metadata?.assignmentId,
            title: m.metadata?.title
        }))
    };
};

export const askCourseAI = async (question, courseId) => {
    const matches = await queryNamespace(COURSE_NAMESPACE, question, {
        courseId: { $eq: Number(courseId) }
    });

    if (matches.length === 0) {
        return {
            answer: "I don't have that information for this course.",
            sources: []
        };
    }

    const context = matches
        .map((m) => m.metadata?.text || "")
        .filter(Boolean)
        .join("\n\n---\n\n");

    const response = await llm.invoke(
        buildPrompt(context, question, "course")
    );

    return {
        answer: response.content,
        sources: matches.map((m) => ({
            courseId: m.metadata?.courseId,
            title: m.metadata?.title
        }))
    };
};