import {
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type MonthlyDataPoint = {
  label: string;
  income: number;
  expenses: number;
  net: number;
  balance: number;
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d: MonthlyDataPoint = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm shadow">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-green-600">Income: ${d.income} CAD</p>
      <p className="text-red-600">Expenses: ${d.expenses} CAD</p>
      <p className={d.net >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
        Net: {d.net >= 0 ? '+' : ''}${d.net} CAD
      </p>
      <p className="text-blue-600">Balance: ${d.balance} CAD</p>
    </div>
  );
}

export default function FinancesChart({ data }: { data: MonthlyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v: number) => `$${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
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
  );
}
