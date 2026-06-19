#!/usr/bin/env node
// Usage: node scripts/process-wise-csv.mjs <path-to-wise-export.csv>
// Outputs rounded transaction data to src/data/finances/wise.json
// WARNING: Never commit the original CSV — it contains unrounded amounts.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/data/finances/wise.json');

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node scripts/process-wise-csv.mjs <path-to-wise-export.csv>');
  process.exit(1);
}

const csv = readFileSync(resolve(csvPath), 'utf8');
const lines = csv.trim().split('\n');

const headers = parseCSVLine(lines[0]);
const COL = Object.fromEntries(headers.map((h, i) => [h.trim(), i]));

const required = ['ID', 'Status', 'Direction', 'Created on', 'Source amount (after fees)', 'Source currency', 'Target name', 'Category', 'Note', 'Reference'];
for (const col of required) {
  if (COL[col] === undefined) {
    console.error(`Missing expected column: "${col}"`);
    process.exit(1);
  }
}

// Load existing output to preserve manually-edited category fields
let existing = { account: 'wise', balance: null, balance_currency: 'EUR', balance_updated: null, transactions: [] };
if (existsSync(OUTPUT_PATH)) {
  existing = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
}
const existingById = Object.fromEntries(existing.transactions.map(t => [t.id, t]));

const transactions = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const row = parseCSVLine(line);
  const id = row[COL['ID']]?.trim();
  if (!id) continue;

  const status = row[COL['Status']]?.trim();
  if (status !== 'COMPLETED') continue;

  const rawAmount = parseFloat(row[COL['Source amount (after fees)']] || '0');
  const prev = existingById[id];

  transactions.push({
    id,
    date: row[COL['Created on']]?.trim().slice(0, 10),
    direction: row[COL['Direction']]?.trim(),
    amount: Math.round(Math.abs(rawAmount)),
    currency: row[COL['Source currency']]?.trim(),
    merchant: (row[COL['Target name']]?.trim() || row[COL['Reference']]?.trim() || '').slice(0, 60),
    // Preserve manual category overrides; fall back to Wise-provided category
    category: prev?.category ?? (row[COL['Category']]?.trim() || null),
    note: row[COL['Note']]?.trim() || null,
  });
}

const output = {
  ...existing,
  transactions,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote ${transactions.length} transactions to ${OUTPUT_PATH}`);
console.log('Remember to update balance and balance_updated manually in the JSON file.');

// Minimal CSV parser (handles quoted fields and escaped quotes)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
