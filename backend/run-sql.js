import { Pool } from 'pg';
import dotenv from "dotenv"
dotenv.config();


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool
  .query(`

   select*from users;
  `)
  .then((result) => console.table(result.rows))
  .catch(console.error)
  .finally(() => pool.end());