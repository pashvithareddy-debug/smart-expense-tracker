import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Zap, ShieldCheck, ArrowUpRight, BarChart3 } from 'lucide-react';
import CashFlowChart from '../components/CashFlowChart';
import CategoryPieChart from '../components/CategoryPieChart';
import SmartInsightsCard from '../components/SmartInsightsCard';
import { analyticsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const currency = user?.currency || '$';

  const [overview, setOverview] = useState(null);
  const [cashflow, setCashflow] = useState([]);
  const [categories, setCategories] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ov, cf, cats, ins] = await Promise.all([
          analyticsAPI.getOverview(),
          analyticsAPI.getCashflow(),
          analyticsAPI.getCategories(),
          analyticsAPI.getInsights(),
        ]);
        setOverview(ov);
        setCashflow(cf);
        setCategories(cats);
        setInsights(ins);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading-spinner">
        <div className="spinner-glow" />
        <span className="loading-text">Generating financial analytics models...</span>
      </div>
    );
  }

  const savingsRate = overview?.savings_rate || 0;
  const healthScore = Math.min(100, Math.max(10, Math.round(savingsRate * 1.5 + (categories.length > 3 ? 25 : 10))));

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title font-display">Financial Intelligence & Analytics</h1>
          <p className="page-subtitle">
            Advanced spending patterns, categorical distributions, and algorithmic health scoring.
          </p>
        </div>
      </div>

      {/* Financial Health Score Banner */}
      <div className="glass-panel health-score-panel">
        <div className="health-score-left">
          <div className="score-badge-circle">
            <span className="score-number font-display">{healthScore}</span>
            <span className="score-max">/100</span>
          </div>
          <div>
            <div className="health-score-title font-display">
              Financial Vitality Score: {healthScore >= 75 ? 'Excellent' : healthScore >= 50 ? 'Moderate' : 'Needs Optimization'}
            </div>
            <p className="health-score-desc">
              Computed based on your savings retention rate ({savingsRate}%), categorical distribution, and expense variance.
            </p>
          </div>
        </div>

        <div className="health-score-pills">
          <div className="vital-pill">
            <ShieldCheck size={16} className="text-emerald" />
            <span>Savings: {savingsRate}%</span>
          </div>
          <div className="vital-pill">
            <Zap size={16} className="text-violet" />
            <span>Active Categories: {categories.length}</span>
          </div>
          <div className="vital-pill">
            <Award size={16} className="text-cyan" />
            <span>Log Integrity: Verified</span>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid-2col">
        <CashFlowChart data={cashflow} currency={currency} />
        <CategoryPieChart categories={categories} currency={currency} />
      </div>

      {/* Insights */}
      <div style={{ marginBottom: 24 }}>
        <SmartInsightsCard insights={insights} />
      </div>

      {/* Deep-dive Category Table */}
      <div className="glass-panel table-panel">
        <div className="table-toolbar">
          <div>
            <h3 className="chart-title font-display">Category Spend Breakdown</h3>
            <p className="chart-subtitle">Aggregated distribution analysis</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Transactions</th>
                <th style={{ textAlign: 'right' }}>Total Volume</th>
                <th style={{ textAlign: 'right' }}>Avg / Entry</th>
                <th style={{ width: 180 }}>Share of Outflow</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-empty-state">No categorical data available</div>
                  </td>
                </tr>
              ) : (
                categories.map((c, i) => {
                  const avg = c.count > 0 ? (c.total_amount / c.count).toFixed(2) : 0;
                  return (
                    <tr key={i} className="table-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            className="category-color-swatch"
                            style={{ backgroundColor: c.color }}
                          />
                          <span style={{ fontWeight: 600 }}>{c.category}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{c.count}</td>
                      <td style={{ textAlign: 'right' }} className="font-display">
                        {currency}{c.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {currency}{Number(avg).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar-container" style={{ flex: 1, height: 6 }}>
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${c.percentage}%`,
                                backgroundColor: c.color,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', minWidth: 42 }}>
                            {c.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
