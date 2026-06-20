import { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type MonthlyDataPoint = {
  label: string;
  income: number;
  expenses: number;
  net: number;
  balance: number;
};

function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  const d: MonthlyDataPoint = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm shadow">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-green-600">Income: ${d.income} {currency}</p>
      <p className="text-red-600">Expenses: ${d.expenses} {currency}</p>
      <p className={d.net >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
        Net: {d.net >= 0 ? '+' : ''}${d.net} {currency}
      </p>
      <p className="text-blue-600">Balance: ${d.balance} {currency}</p>
    </div>
  );
}

export default function FinancesChart({ data6, data12, currency }: { data6: MonthlyDataPoint[]; data12: MonthlyDataPoint[]; currency: string }) {
  const [range, setRange] = useState<6 | 12>(6);
  const data = range === 6 ? data6 : data12;

  return (
    <div>
      <div className="flex gap-3 mb-4 text-sm justify-end">
        <button
          onClick={() => setRange(6)}
          className={range === 6 ? 'font-semibold text-gray-900' : 'text-gray-400 hover:text-gray-600'}
        >
          6M
        </button>
        <button
          onClick={() => setRange(12)}
          className={range === 12 ? 'font-semibold text-gray-900' : 'text-gray-400 hover:text-gray-600'}
        >
          12M
        </button>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v: number) => `$${v}`} />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Bar dataKey="net" name="Net Income">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.net >= 0 ? '#16a34a' : '#dc2626'} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#2563eb"
            name="Balance"
            dot={false}
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
