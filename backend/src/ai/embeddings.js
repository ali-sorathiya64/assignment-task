import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_EMBEDDING_MODEL,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1"
    }
});

export default embeddings;