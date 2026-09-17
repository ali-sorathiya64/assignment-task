import "dotenv/config";

export const PORT = process.env.PORT || 8000;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
}