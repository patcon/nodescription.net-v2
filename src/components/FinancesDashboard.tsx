import { useState } from 'react';
import FinancesChart from './FinancesChart';

type MonthlyDataPoint = {
  label: string;
  income: number;
  expenses: number;
  net: number;
  balance: number;
};

type MonthlySummary = {
  label: string;
  totalOut: number;
  totalIn: number;
  categoryBreakdown: [string, number][];
  incomeBreakdown: [string, number][];
};

type Currency = 'CAD' | 'EUR' | 'USD' | 'GBP';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  CAD: '$',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export default function FinancesDashboard({
  grandTotalCad,
  wiseTotalCad,
  rbcTotalCad,
  wiseSubBalances,
  rbcSubAccounts,
  wiseUpdated,
  rbcUpdated,
  rbcLabel,
  monthlyData6,
  monthlyData12,
  monthlySummaries,
  cadRates,
}: {
  grandTotalCad: number;
  wiseTotalCad: number;
  rbcTotalCad: number;
  wiseSubBalances: [string, number][];
  rbcSubAccounts: { label: string; amount: number; currency: string }[];
  wiseUpdated: string | null;
  rbcUpdated: string | null;
  rbcLabel: string;
  monthlyData6: MonthlyDataPoint[];
  monthlyData12: MonthlyDataPoint[];
  monthlySummaries: MonthlySummary[];
  cadRates: Record<string, number>;
}) {
  const [currency, setCurrency] = useState<Currency>('CAD');
  const [selectedMonth, setSelectedMonth] = useState(0);

  const convert = (cad: number) => Math.round(cad * (cadRates[currency] ?? 1));
  const sym = CURRENCY_SYMBOLS[currency];

  const convertData = (data: MonthlyDataPoint[]): MonthlyDataPoint[] =>
    data.map(d => ({
      ...d,
      income: convert(d.income),
      expenses: convert(d.expenses),
      net: convert(d.net),
      balance: convert(d.balance),
    }));

  const ALL_CURRENCIES: Currency[] = ['CAD', 'EUR', 'USD', 'GBP'];

  const summary = monthlySummaries[selectedMonth];

  return (
    <>
      {/* Grand Total */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Total Balance</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">{sym}{convert(grandTotalCad)}</span>
          <div>
            <div className="text-4xl font-bold text-gray-900 leading-none">{currency}</div>
            <div className="flex gap-3 mt-1">
              {ALL_CURRENCIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`text-sm font-bold ${c === currency ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Per-account sub-balances */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Wise */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Wise App</p>
          <p className="text-xl font-semibold text-gray-800">{sym}{convert(wiseTotalCad)} {currency}</p>
          {wiseSubBalances.length > 0 && (
            <div className="text-xs text-gray-400 mt-1 space-y-0.5">
              {wiseSubBalances.map(([cur, amount]) => (
                <p key={cur}>{amount} {cur}</p>
              ))}
            </div>
          )}
          {wiseUpdated && (
            <p className="text-xs text-gray-300 mt-1">Updated {wiseUpdated}</p>
          )}
        </div>

        {/* Bank */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{rbcLabel}</p>
          <p className="text-xl font-semibold text-gray-800">{sym}{convert(rbcTotalCad)} {currency}</p>
          <div className="text-xs text-gray-400 mt-1 space-y-0.5">
            {rbcSubAccounts.filter(a => a.amount > 0).map(a => (
              <p key={a.label}>{a.amount} {a.currency} {a.label}</p>
            ))}
          </div>
          {rbcUpdated && (
            <p className="text-xs text-gray-300 mt-1">Updated {rbcUpdated}</p>
          )}
        </div>
      </div>

      {/* Net Income & Expense Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Net Income &amp; Expense</h2>
        <FinancesChart
          data6={convertData(monthlyData6)}
          data12={convertData(monthlyData12)}
          currency={currency}
        />
      </div>

      {/* Monthly Summary with navigation */}
      {summary && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedMonth(i => i + 1)}
              disabled={selectedMonth >= monthlySummaries.length - 1}
              className="text-xl text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed px-1"
              aria-label="Previous month"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold">{summary.label} Summary</h2>
            <button
              onClick={() => setSelectedMonth(i => i - 1)}
              disabled={selectedMonth === 0}
              className="text-xl text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed px-1"
              aria-label="Next month"
            >
              →
            </button>
          </div>
          <div className="flex gap-8 mb-6">
            <div>
              <p className="text-sm text-gray-500">Spent</p>
              <p className="text-2xl font-bold text-red-600">{sym}{convert(summary.totalOut)} {currency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Received</p>
              <p className="text-2xl font-bold text-green-600">{sym}{convert(summary.totalIn)} {currency}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Expenses</p>
              <div className="space-y-1">
                {summary.categoryBreakdown.map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-gray-600">{cat}</span>
                    <span className="font-mono text-red-600">{sym}{convert(amount)} {currency}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rent</span>
                  <span className="font-mono text-red-600">{sym}0 {currency} *</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">* Rent exchanged for childcare</p>
            </div>
            {summary.incomeBreakdown.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Income</p>
                <div className="space-y-1">
                  {summary.incomeBreakdown.map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="text-gray-600">{cat}</span>
                      <span className="font-mono text-green-600">{sym}{convert(amount)} {currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
