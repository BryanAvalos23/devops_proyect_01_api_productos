/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

async function migrate(): Promise<void> {
  const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  console.log('Aplicando schema.sql a la base de datos...');
  await pool.query(sql);
  console.log('Migración completada.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Error ejecutando la migración:', err);
  process.exit(1);
});
