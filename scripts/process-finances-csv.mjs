#!/usr/bin/env node
// Usage: node scripts/process-finances-csv.mjs <path-to-csv> [--since=YYYY-MM-DD]
// Auto-detects Wise or RBC format from CSV headers.
// Outputs rounded transaction data to src/data/finances/wise.json or rbc.json.
// WARNING: Never commit the original CSV — it contains unrounded amounts.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const csvPath = args.find(a => !a.startsWith('--'));
const sinceArg = args.find(a => a.startsWith('--since='));
const sinceDate = sinceArg ? sinceArg.slice('--since='.length) : null;

if (!csvPath) {
  console.error('Usage: node scripts/process-finances-csv.mjs <path-to-csv> [--since=YYYY-MM-DD]');
  process.exit(1);
}

let csv;
if (/^https?:\/\/drive\.google\.com\//.test(csvPath)) {
  const fileId = csvPath.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!fileId) { console.error('Could not extract file ID from Google Drive URL.'); process.exit(1); }
  const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
  const res = await fetch(url);
  if (!res.ok) { console.error(`Failed to download from Google Drive: ${res.status} ${res.statusText}`); process.exit(1); }
  csv = await res.text();
  console.log(`Downloaded CSV from Google Drive (file ID: ${fileId})`);
} else {
  csv = readFileSync(resolve(csvPath), 'utf8');
}
const lines = csv.trim().split('\n');
const headers = parseCSVLine(lines[0]);
const COL = Object.fromEntries(headers.map((h, i) => [h.trim(), i]));

const isWise = ['ID', 'Status', 'Direction', 'Source amount (after fees)'].every(h => COL[h] !== undefined);
const isRBC = ['Account Type', 'Account Number', 'Transaction Date', 'CAD$'].every(h => COL[h] !== undefined);

if (!isWise && !isRBC) {
  console.error('Unrecognized CSV format. Expected Wise or RBC export headers.');
  process.exit(1);
}

console.error('WARNING: Never commit the original CSV — it contains unrounded amounts.');

if (isWise) processWise(lines, COL);
else processRBC(lines, COL);

function processWise(lines, COL) {
  const OUTPUT_PATH = resolve(__dirname, '../src/data/finances/wise.json');
  let existing = { account: 'wise', balance: null, balance_currency: 'EUR', balance_updated: null, transactions: [] };
  if (existsSync(OUTPUT_PATH)) existing = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  const existingById = Object.fromEntries(existing.transactions.map(t => [t.id, t]));

  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = parseCSVLine(line);
    const id = row[COL['ID']]?.trim();
    if (!id) continue;
    if (row[COL['Status']]?.trim() !== 'COMPLETED') continue;

    const date = row[COL['Created on']]?.trim().slice(0, 10);
    if (sinceDate && date < sinceDate) continue;

    const rawAmount = parseFloat(row[COL['Source amount (after fees)']] || '0');
    const prev = existingById[id];
    transactions.push({
      id,
      date,
      direction: row[COL['Direction']]?.trim(),
      amount: Math.round(Math.abs(rawAmount)),
      currency: row[COL['Source currency']]?.trim(),
      merchant: (row[COL['Target name']]?.trim() || row[COL['Reference']]?.trim() || '').slice(0, 60),
      category: prev?.category ?? (row[COL['Category']]?.trim() || null),
      note: row[COL['Note']]?.trim() || null,
    });
  }

  const merged = mergeTransactions(existing.transactions, transactions);
  writeFileSync(OUTPUT_PATH, JSON.stringify({ ...existing, transactions: merged }, null, 2) + '\n');
  console.log(`Wrote ${merged.length} Wise transactions to ${OUTPUT_PATH} (${transactions.length} from CSV, ${merged.length - transactions.length} preserved from prior runs)`);
  console.log('Remember to update balances and balance_updated manually in the JSON file.');
}

function processRBC(lines, COL) {
  const OUTPUT_PATH = resolve(__dirname, '../src/data/finances/rbc.json');
  let existing = { account: 'rbc', label: 'Bank', sub_accounts: [], balance_updated: null, transactions: [] };
  if (existsSync(OUTPUT_PATH)) existing = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  const existingById = Object.fromEntries(existing.transactions.map(t => [t.id, t]));

  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = parseCSVLine(line);

    const rawCad = row[COL['CAD$']]?.trim();
    if (!rawCad) continue;
    const rawAmount = parseFloat(rawCad);
    if (!rawAmount) continue;

    const rawDate = row[COL['Transaction Date']]?.trim();
    const date = parseRBCDate(rawDate);
    if (!date) continue;
    if (sinceDate && date < sinceDate) continue;

    const desc1 = row[COL['Description 1']]?.trim() || '';
    const desc2 = row[COL['Description 2']]?.trim() || '';
    const roundedAmount = Math.round(Math.abs(rawAmount));

    const idParts = [date, desc1, desc2, roundedAmount]
      .map(p => String(p).toLowerCase().replace(/\s+/g, '_'))
      .join('-');
    const id = `rbc-${idParts}`;

    const accountType = row[COL['Account Type']]?.trim().toLowerCase();
    const prev = existingById[id];
    transactions.push({
      id,
      date,
      direction: rawAmount > 0 ? 'IN' : 'OUT',
      amount: roundedAmount,
      currency: 'CAD',
      account_type: accountType || null,
      merchant: (desc2 || desc1).slice(0, 60),
      category: prev?.category ?? null,
      note: desc1 || null,
    });
  }

  const merged = mergeTransactions(existing.transactions, transactions);
  writeFileSync(OUTPUT_PATH, JSON.stringify({ ...existing, transactions: merged }, null, 2) + '\n');
  console.log(`Wrote ${merged.length} RBC transactions to ${OUTPUT_PATH} (${transactions.length} from CSV, ${merged.length - transactions.length} preserved from prior runs)`);
  console.log('Remember to update sub_accounts and balance_updated manually in the JSON file.');
}

function mergeTransactions(existing, incoming) {
  const map = Object.fromEntries(existing.map(t => [t.id, t]));
  for (const t of incoming) map[t.id] = t;
  return Object.values(map).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

function parseRBCDate(str) {
  if (!str) return null;
  // Handles M/D/YYYY or MM/DD/YYYY
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, month, day, year] = m;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

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
