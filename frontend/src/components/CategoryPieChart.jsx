import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

function CustomPieTooltip({ active, payload, currency = '$' }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="chart-tooltip-panel">
        <div className="tooltip-title" style={{ color: item.color }}>
          {item.category}
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Spent:</span>
          <span className="tooltip-value font-display">
            {currency}{item.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Portion:</span>
          <span className="tooltip-value">{item.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function CategoryPieChart({ categories = [], currency = '$' }) {
  const totalSpent = categories.reduce((sum, c) => sum + c.total_amount, 0);

  return (
    <div className="glass-panel chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-title font-display">Spending by Category</h3>
          <p className="chart-subtitle">Distribution across expense categories</p>
        </div>
        <div className="category-total-badge">
          Total: {currency}{totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="category-pie-container">
        {categories.length === 0 ? (
          <div className="chart-empty-state" style={{ height: 260 }}>
            No expense categories recorded
          </div>
        ) : (
          <>
            <div style={{ width: '100%', height: 230, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip currency={currency} />} />
                  <Pie
                    data={categories}
                    dataKey="total_amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center stat inside donut */}
              <div className="donut-center-content">
                <span className="donut-center-label">Categories</span>
                <span className="donut-center-value font-display">{categories.length}</span>
              </div>
            </div>

            {/* Category breakdown rows */}
            <div className="category-breakdown-list">
              {categories.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="category-item-row">
                  <div className="category-item-info">
                    <span
                      className="category-color-swatch"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="category-name">{cat.category}</span>
                  </div>
                  <div className="category-item-stats">
                    <span className="category-amount">
                      {currency}{cat.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="category-pct">{cat.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
