import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  PlusCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import CashFlowChart from '../components/CashFlowChart';
import CategoryPieChart from '../components/CategoryPieChart';
import SmartInsightsCard from '../components/SmartInsightsCard';
import { analyticsAPI, txAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ onOpenAddTx, onNavigateTransactions }) {
  const { user } = useAuth();
  const currency = user?.currency || '$';

  const [overview, setOverview] = useState(null);
  const [cashflow, setCashflow] = useState([]);
  const [categories, setCategories] = useState([]);
  const [insights, setInsights] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [overviewData, cashflowData, catData, insightData, txData] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getCashflow(),
        analyticsAPI.getCategories(),
        analyticsAPI.getInsights(),
        txAPI.list({ limit: 5, sort_by: 'date', sort_order: 'desc' }),
      ]);

      setOverview(overviewData);
      setCashflow(cashflowData);
      setCategories(catData);
      setInsights(insightData);
      setRecentTx(txData?.transactions || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading-spinner">
        <div className="spinner-glow" />
        <span className="loading-text">Synthesizing financial telemetry...</span>
      </div>
    );
  }

  const balanceVal = overview?.total_balance || 0;
  const incomeVal = overview?.total_income || 0;
  const expenseVal = overview?.total_expense || 0;
  const savingsRate = overview?.savings_rate || 0;

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-banner">
        <div>
          <h1 className="dashboard-heading font-display">
            Welcome back, <span className="text-highlight">{user?.name || 'Explorer'}</span>
          </h1>
          <p className="dashboard-subheading">
            Here is your financial status overview and real-time cash flow telemetry.
          </p>
        </div>

        <div className="dashboard-banner-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            title="Refresh analytics data"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenAddTx}>
            <PlusCircle size={16} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid-kpi">
        <MetricCard
          title="Total Net Balance"
          value={`${currency}${balanceVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle={balanceVal >= 0 ? 'Positive liquidity' : 'Deficit position'}
          icon={Wallet}
          colorScheme={balanceVal >= 0 ? 'emerald' : 'rose'}
          badgeText={balanceVal >= 0 ? 'Healthy' : 'Deficit'}
        />

        <MetricCard
          title="Total Income"
          value={`${currency}${incomeVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Recorded inflow"
          icon={TrendingUp}
          colorScheme="emerald"
          badgeText="Inflow"
        />

        <MetricCard
          title="Total Expenses"
          value={`${currency}${expenseVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Recorded outflow"
          icon={TrendingDown}
          colorScheme="rose"
          badgeText="Outflow"
        />

        <MetricCard
          title="Net Savings Rate"
          value={`${savingsRate}%`}
          subtitle={savingsRate >= 20 ? 'Target achieved (≥20%)' : 'Target: 20% savings'}
          icon={Percent}
          colorScheme={savingsRate >= 20 ? 'violet' : 'cyan'}
          badgeText={savingsRate >= 20 ? 'Optimal' : 'Standard'}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid-2col">
        <CashFlowChart data={cashflow} currency={currency} />
        <CategoryPieChart categories={categories} currency={currency} />
      </div>

      {/* Bottom Row: Insights + Recent Activity */}
      <div className="grid-2col">
        <SmartInsightsCard insights={insights} />

        {/* Recent Transactions Panel */}
        <div className="glass-panel recent-tx-panel">
          <div className="panel-header-row">
            <div>
              <h3 className="chart-title font-display">Recent Activity</h3>
              <p className="chart-subtitle">Latest recorded financial entries</p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onNavigateTransactions}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="recent-tx-list">
            {recentTx.length === 0 ? (
              <div className="chart-empty-state" style={{ height: 160 }}>
                No recent transactions recorded.
              </div>
            ) : (
              recentTx.map((tx) => {
                const isIncome = tx.transaction_type === 'income';
                return (
                  <div key={tx.id} className="recent-tx-item">
                    <div className="recent-tx-left">
                      <div className={`tx-icon-dot ${isIncome ? 'income' : 'expense'}`}>
                        {isIncome ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </div>
                      <div>
                        <div className="recent-tx-title">{tx.title}</div>
                        <div className="recent-tx-meta">
                          <span className="badge-meta">{tx.category}</span>
                          <span>•</span>
                          <span>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`recent-tx-amount font-display ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                      {isIncome ? '+' : '-'}{currency}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
