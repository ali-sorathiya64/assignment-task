import "dotenv/config";
import embeddings from "./src/ai/embeddings.js";

const run = async () => {
    const result = await embeddings.embedQuery(
        "What is the database assignment?"
    );

    console.log("Embedding generated");
    console.log("Dimensions:", result.length);
    console.log("First 5 values:", result.slice(0, 5));
};

run().catch((error) => {
    console.error("Embedding test failed:");
    console.error(error);
});