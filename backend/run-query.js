import { Pool } from 'pg';
import dotenv from "dotenv"
import fs from "fs"
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = fs.readFileSync('./src/db/migrations/round3-grading.sql', 'utf8');

pool.query(sql)
  .then(() => console.log(" Round 3 migration applied"))
  .catch(console.error)
  .finally(() => pool.end());