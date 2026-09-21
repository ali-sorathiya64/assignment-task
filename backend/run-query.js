import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

const sqlPath = path.join(process.cwd(), 'src', 'db', '''round2.sql');

const sql = fs.readFileSync(sqlPath, 'utf8');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

try {
  await client.connect();

  console.log('Connected to database');

  await client.query(sql);

  console.log('Round 2 migration completed successfully');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}