import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function CustomTooltip({ active, payload, label, currency = '$' }) {
  if (active && payload && payload.length) {
    const income = payload.find((p) => p.dataKey === 'income')?.value || 0;
    const expense = payload.find((p) => p.dataKey === 'expense')?.value || 0;
    const net = income - expense;

    return (
      <div className="chart-tooltip-panel">
        <div className="tooltip-title">{label}</div>
        <div className="tooltip-row">
          <span className="tooltip-dot" style={{ backgroundColor: '#10b981' }} />
          <span className="tooltip-label">Income:</span>
          <span className="tooltip-value">{currency}{income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-dot" style={{ backgroundColor: '#f43f5e' }} />
          <span className="tooltip-label">Expense:</span>
          <span className="tooltip-value">{currency}{expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="tooltip-divider" />
        <div className="tooltip-row">
          <span className="tooltip-dot" style={{ backgroundColor: '#8b5cf6' }} />
          <span className="tooltip-label">Net Flow:</span>
          <span className="tooltip-value" style={{ color: net >= 0 ? '#10b981' : '#f43f5e' }}>
            {net >= 0 ? '+' : ''}{currency}{net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export default function CashFlowChart({ data = [], currency = '$' }) {
  return (
    <div className="glass-panel chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-title font-display">Cash Flow Analysis</h3>
          <p className="chart-subtitle">Monthly Income vs Spending Comparison</p>
        </div>
        <div className="chart-legend-pills">
          <span className="legend-pill">
            <span className="pill-dot" style={{ background: '#10b981' }} />
            Income
          </span>
          <span className="legend-pill">
            <span className="pill-dot" style={{ background: '#f43f5e' }} />
            Expenses
          </span>
        </div>
      </div>

      <div className="chart-body" style={{ width: '100%', height: 320 }}>
        {data.length === 0 ? (
          <div className="chart-empty-state">No transaction history yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${currency}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
