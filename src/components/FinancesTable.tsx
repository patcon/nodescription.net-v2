import { useState } from 'react';

type Transaction = {
  id: string;
  date: string;
  direction: 'IN' | 'OUT';
  amount: number;
  currency: string;
  merchant: string;
  category?: string | null;
  note?: string | null;
  source: 'wise' | 'rbc';
  account_type?: string;
};

type SourceData = {
  transactions: Array<{ id: string; category?: string | null; [key: string]: unknown }>;
  [key: string]: unknown;
};

type Props = {
  initialTransactions: Transaction[];
  wiseRaw: SourceData;
  rbcRaw: SourceData;
};

const CATEGORIES = [
  'Eating out',
  'Groceries',
  'Shopping',
  'Transport',
  'Bills',
  'Trips',
  'Money added',
  'General',
  'Entertainment',
  'Personal care',
  'Charity',
  'Cash',
  'Cafe Rent',
  'Social',
  'Supporters',
  'Client Work',
  'Reimbursement',
  'Gift',
  'Household',
  'Fitness',
  'Account Transfer',
  'Digital Services',
] as const;

function downloadJson(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FinancesTable({ initialTransactions, wiseRaw, rbcRaw }: Props) {
  const [adminMode, setAdminMode] = useState(false);
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string | null>>({});
  const [copiedWise, setCopiedWise] = useState(false);
  const [copiedRbc, setCopiedRbc] = useState(false);

  const transactions = initialTransactions.map(t => ({
    ...t,
    category: t.id in categoryOverrides ? categoryOverrides[t.id] : t.category,
  }));

  const categoryCounts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  for (const t of initialTransactions) {
    if (t.category && t.category in categoryCounts) categoryCounts[t.category]++;
  }
  const sortedCategories = [...CATEGORIES].sort((a, b) => categoryCounts[b] - categoryCounts[a]);

  const hasChanges = Object.keys(categoryOverrides).length > 0;

  function handleToggleAdmin() {
    setAdminMode(prev => !prev);
  }

  const wiseIds = new Set(initialTransactions.filter(t => t.source === 'wise').map(t => t.id));
  const rbcIds = new Set(initialTransactions.filter(t => t.source === 'rbc').map(t => t.id));
  const hasWiseChanges = Object.keys(categoryOverrides).some(id => wiseIds.has(id));
  const hasRbcChanges = Object.keys(categoryOverrides).some(id => rbcIds.has(id));

  function buildUpdatedWise() {
    return {
      ...wiseRaw,
      transactions: wiseRaw.transactions.map(t =>
        t.id in categoryOverrides ? { ...t, category: categoryOverrides[t.id] } : t
      ),
    };
  }

  function buildUpdatedRbc() {
    return {
      ...rbcRaw,
      transactions: rbcRaw.transactions.map(t =>
        t.id in categoryOverrides ? { ...t, category: categoryOverrides[t.id] } : t
      ),
    };
  }

  function handleDownloadWise() { downloadJson(buildUpdatedWise(), 'wise.json'); }
  function handleDownloadRbc() { downloadJson(buildUpdatedRbc(), 'rbc.json'); }

  function handleCopyWise() {
    navigator.clipboard.writeText(JSON.stringify(buildUpdatedWise(), null, 2) + '\n').then(() => {
      setCopiedWise(true);
      setTimeout(() => setCopiedWise(false), 2000);
    });
  }

  function handleCopyRbc() {
    navigator.clipboard.writeText(JSON.stringify(buildUpdatedRbc(), null, 2) + '\n').then(() => {
      setCopiedRbc(true);
      setTimeout(() => setCopiedRbc(false), 2000);
    });
  }

  if (initialTransactions.length === 0) {
    return <p className="text-gray-400 text-sm">No transactions yet. Run the import script to populate data.</p>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <h2 className="text-lg font-semibold p-6 pb-0">Transactions</h2>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-y border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Direction</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Merchant</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-mono text-gray-500 whitespace-nowrap">{t.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.direction === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.direction}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{t.amount} {t.currency}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{t.merchant}</td>
                <td className="px-4 py-3 text-gray-500">
                  {adminMode ? (
                    <select
                      value={
                        t.id in categoryOverrides
                          ? (categoryOverrides[t.id] ?? '')
                          : (t.category ?? '')
                      }
                      onChange={e => {
                        const val = e.target.value;
                        setCategoryOverrides(prev => ({
                          ...prev,
                          [t.id]: val === '' ? null : val,
                        }));
                      }}
                      className="text-sm text-gray-600 border border-gray-200 rounded px-1 py-0.5 bg-white min-w-[130px]"
                    >
                      <option value="">— Uncategorized —</option>
                      {sortedCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    t.category ?? '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {t.source === 'wise' ? 'Wise' : t.account_type === 'chequing' ? 'Bank:CHQ' : t.account_type === 'savings' ? 'Bank:SAV' : 'Bank'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-3 px-4 py-2 border-t border-gray-100">
        {adminMode && (
          <div className="flex flex-col items-end gap-1.5 py-1">
            <div className="flex items-center gap-2">
              {(['wise', 'rbc'] as const).map(source => {
                const isWise = source === 'wise';
                const hasSourceChanges = isWise ? hasWiseChanges : hasRbcChanges;
                const copied = isWise ? copiedWise : copiedRbc;
                const onCopy = isWise ? handleCopyWise : handleCopyRbc;
                const onDownload = isWise ? handleDownloadWise : handleDownloadRbc;
                const filename = isWise ? 'wise.json' : 'rbc.json';
                const btnClass = `text-xs px-2 py-1 rounded border transition-colors whitespace-nowrap ${
                  hasSourceChanges
                    ? 'border-blue-200 text-blue-600 hover:bg-blue-50'
                    : 'border-gray-100 text-gray-300 cursor-not-allowed'
                }`;
                return (
                  <div key={source} className="flex items-center gap-1">
                    <button onClick={onCopy} disabled={!hasSourceChanges} className={btnClass}>
                      {copied ? `✓ ${filename}` : `⎘ ${filename}`}
                    </button>
                    <button onClick={onDownload} disabled={!hasSourceChanges} className={btnClass}>
                      {`↓ ${filename}`}
                    </button>
                  </div>
                );
              })}
            </div>
            <span className="text-xs text-gray-400">Edit categories — copy or download JSON to commit</span>
          </div>
        )}
        <button
          onClick={handleToggleAdmin}
          title="Admin: recategorize expenses"
          className={`transition-colors ${adminMode ? 'text-blue-500' : 'text-gray-200 hover:text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
