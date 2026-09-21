import { ChatOpenAI } from "@langchain/openai";
import embeddings from "./embeddings.js";
import pineconeIndex from "./vectorStore.js";
import { NAMESPACE } from "./indexAssignment.js";

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

export const askAssignmentAI = async (question, assignmentId) => {
    const queryEmbedding = await embeddings.embedQuery(question);

    const result = await pineconeIndex.namespace(NAMESPACE).query({
        vector: queryEmbedding,
        topK: TOP_K,
        includeMetadata: true,
        filter: {
            assignmentId: { $eq: Number(assignmentId) }
        }
    });

    const allMatches = result.matches || [];

    console.log(
        `[AI] Query for assignment ${assignmentId} — matches: ${allMatches.length}`
    );
    for (const m of allMatches) {
        console.log(
            `[AI]   id=${m.id} score=${m.score?.toFixed(4)} title="${m.metadata?.title}"`
        );
    }

    const matches = allMatches.filter(
        (m) => (m.score ?? 0) >= SCORE_THRESHOLD
    );

    if (matches.length === 0) {
        return {
            answer:
                "I couldn't find this assignment's details. Try asking about the title, description, deadline, or submission link.",
            sources: []
        };
    }

    const context = matches
        .map((match) => match.metadata?.text || "")
        .filter(Boolean)
        .join("\n\n---\n\n");

    const prompt = `
You are an AI assistant for a student assignment management system.

The student is asking about ONE specific assignment. Below is all the information we have about it.

RULES:
1. Answer using ONLY the information below.
2. If the student asks about something present below, answer it directly and concisely.
3. If the answer is genuinely NOT present below, respond with exactly:
   "I don't have that information for this assignment."
4. Do not invent deadlines, links, or requirements.
5. Keep answers short — 1 to 3 sentences unless the student asks for detail.

ASSIGNMENT INFORMATION:
${context}

STUDENT QUESTION:
${question}

ANSWER:
    `.trim();

    const response = await llm.invoke(prompt);

    return {
        answer: response.content,
        sources: matches.map((match) => ({
            assignmentId: match.metadata?.assignmentId,
            title: match.metadata?.title
        }))
    };
};