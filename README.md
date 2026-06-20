# nodescription.net v2

Personal site built with Astro 5, React 19, and Tailwind CSS. Deployed to GitHub Pages on push to `master`.

## Development

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Production build to /dist
npm run preview  # Preview production build locally
```

## Finances page

`/finances` is a personal spending dashboard that aggregates transactions from two accounts — **Wise** (multi-currency) and **RBC** (CAD) — and displays them with charts, monthly summaries, and a categorized transaction table. Exchange rates are fetched from [Frankfurter](https://frankfurter.app/) at build time and amounts are normalized to CAD for display.

### Data files

Transaction data lives in `src/data/finances/` and is committed to the repo **in rounded form** (amounts rounded to the nearest dollar) to avoid leaking exact figures.

| File | Account | Updated by |
|---|---|---|
| `wise.json` | Wise (multi-currency) | `npm run process-csv <wise-export.csv>` |
| `rbc.json` | RBC bank account | `npm run process-csv <rbc-export.csv>` |

Both files also hold balance snapshots (`balances` / `sub_accounts`) and a `balance_updated` date that must be updated manually after each import.

### Importing transactions

Download a CSV export from Wise or RBC, then run:

```bash
npm run process-csv /path/to/export.csv
# or directly from Google Drive:
npm run process-csv "https://drive.google.com/file/d/<id>/view"
```

The script auto-detects the format from the CSV headers. Only `COMPLETED` transactions are included. Pass `--since=YYYY-MM-DD` to limit how far back it imports.

Imports are **additive and idempotent** — re-running against the same CSV won't duplicate transactions. Manually assigned `category` values are preserved across re-imports.

> **Warning:** never commit the original CSV — it contains unrounded amounts.

### Categorizing transactions

Categories are stored directly in the JSON files. Edit the `category` field on any transaction and it will survive future re-imports (the script carries `category` forward by transaction ID).

### Wise split-currency transactions

When a Wise payment draws from multiple currency sub-accounts (e.g. a purchase charged to both GBP and CAD balances), Wise exports two CSV rows sharing the same transaction ID. The import script detects this and stores them as separate entries suffixed by currency — e.g. `CARD_TRANSACTION-123-GBP` and `CARD_TRANSACTION-123-CAD` — so both appear in the dashboard.
