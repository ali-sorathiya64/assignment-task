import { ChatOpenAI } from "@langchain/openai";
import embeddings from "./embeddings.js";
import pineconeIndex from "./vectorStore.js";

const llm = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL,
    temperature: 0,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1"
    }
});

export const askAssignmentAI = async (question, assignmentId) => {
    const queryEmbedding = await embeddings.embedQuery(question);

    const result = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: 3,
        includeMetadata: true,
        filter: {
            assignmentId: {
                $eq: Number(assignmentId)
            }
        }
    });

    if (!result.matches || result.matches.length === 0) {
        return {
            answer: "I could not find information about this assignment.",
            sources: []
        };
    }

    const context = result.matches
        .map((match) => match.metadata?.text || "")
        .filter(Boolean)
        .join("\n\n");

    const prompt = `
You are an AI assistant for a student assignment management system.

Answer the student's question using only the provided assignment information.

Do not invent assignment requirements, deadlines, submission links, or instructions.

If the information is not available, say:
"I don't have enough information about this assignment."

Assignment information:

${context}

Student question:
${question}
    `.trim();

    const response = await llm.invoke(prompt);

    return {
        answer: response.content,
        sources: result.matches.map((match) => ({
            assignmentId: match.metadata?.assignmentId,
            title: match.metadata?.title
        }))
    };
};