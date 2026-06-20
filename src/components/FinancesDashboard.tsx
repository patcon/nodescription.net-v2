import { useState } from 'react';
import FinancesChart from './FinancesChart';

type MonthlyDataPoint = {
  label: string;
  income: number;
  expenses: number;
  net: number;
  balance: number;
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
  totalOutCad,
  totalInCad,
  categoryBreakdownCad,
  lastMonthLabel,
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
  totalOutCad: number;
  totalInCad: number;
  categoryBreakdownCad: [string, number][];
  lastMonthLabel: string | null;
  cadRates: Record<string, number>;
}) {
  const [currency, setCurrency] = useState<Currency>('CAD');

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

      {/* Last Month Summary */}
      {lastMonthLabel && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">{lastMonthLabel} Summary</h2>
          <div className="flex gap-8 mb-4">
            <div>
              <p className="text-sm text-gray-500">Spent</p>
              <p className="text-2xl font-bold text-red-600">{sym}{convert(totalOutCad)} {currency}</p>
            </div>
            {totalInCad > 0 && (
              <div>
                <p className="text-sm text-gray-500">Received</p>
                <p className="text-2xl font-bold text-green-600">{sym}{convert(totalInCad)} {currency}</p>
              </div>
            )}
          </div>
          {categoryBreakdownCad.length > 0 && (
            <div className="space-y-1">
              {categoryBreakdownCad.map(([cat, amount]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-gray-600">{cat}</span>
                  <span className="font-mono text-gray-800">{sym}{convert(amount)} {currency}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
