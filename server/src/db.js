import fs from 'node:fs';
import path from 'node:path';
import { createSeedData } from '../data/seed.js';

const dbFile = process.env.DB_FILE || path.join(import.meta.dirname, '../data/db.json');

function load() {
  if (!fs.existsSync(dbFile)) {
    const data = createSeedData();
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
    return data;
  }
  return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}

export const db = load();

export function save() {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}
