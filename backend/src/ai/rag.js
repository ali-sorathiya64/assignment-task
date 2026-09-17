import vectorStore from "./vectorStore.js";
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL,
    temperature: 0,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1"
    }
});

export const askAssignmentAI = async (question, assignmentId) => {
    const documents = await vectorStore.similaritySearch(
        question,
        4,
        {
            assignmentId: Number(assignmentId)
        }
    );

    if (documents.length === 0) {
        return {
            answer: "I could not find information about this assignment."
        };
    }

    const context = documents
        .map((document) => document.pageContent)
        .join("\n\n");

    const prompt = `
You are an AI assistant for a student assignment management system.

Answer the student's question using only the assignment information provided below.

If the answer is not available in the provided information, say:
"I don't have enough information about this assignment."

Do not invent requirements, deadlines, links, or instructions.

Assignment information:
${context}

Student question:
${question}
    `.trim();

    const response = await llm.invoke(prompt);

    return {
        answer: response.content,
        sources: documents.map((document) => ({
            assignmentId: document.metadata.assignmentId,
            title: document.metadata.title
        }))
    };
};