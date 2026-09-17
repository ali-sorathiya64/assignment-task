import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import embeddings from "./embeddings.js";

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

const pineconeIndex = pinecone.Index(
    process.env.PINECONE_INDEX_NAME
);

export const vectorStore = new PineconeStore(embeddings, {
    pineconeIndex,
    namespace: "assignments"
});

export default vectorStore;