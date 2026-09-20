import React, { useState, useEffect } from 'react';
import { Target, PlusCircle, AlertCircle, CheckCircle2, ShieldAlert, Edit2, Trash2, ArrowUpRight } from 'lucide-react';
import BudgetModal from '../components/BudgetModal';
import { budgetAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function BudgetsPage({ showToast }) {
  const { user } = useAuth();
  const currency = user?.currency || '$';

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  const loadBudgets = async () => {
    try {
      const data = await budgetAPI.list();
      setBudgets(data || []);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleSaveBudget = async (category, limitVal, budgetId) => {
    try {
      if (budgetId) {
        await budgetAPI.update(budgetId, limitVal);
        showToast?.(`Budget for ${category} updated to ${currency}${limitVal.toFixed(2)}.`, 'success', 'Budget Updated');
      } else {
        await budgetAPI.set(category, limitVal);
        showToast?.(`Monthly budget of ${currency}${limitVal.toFixed(2)} set for ${category}.`, 'success', 'Budget Activated');
      }
      loadBudgets();
      setModalOpen(false);
      setSelectedBudget(null);
    } catch (err) {
      showToast?.(err.message || 'Failed to save budget', 'error', 'Error');
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (window.confirm('Delete this budget limit?')) {
      try {
        await budgetAPI.delete(budgetId);
        showToast?.('Budget limit removed.', 'info', 'Budget Removed');
        loadBudgets();
      } catch (err) {
        showToast?.(err.message || 'Failed to delete budget', 'error', 'Error');
      }
    }
  };

  const totalAllocated = budgets.reduce((acc, b) => acc + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const overallPct = totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0;

  return (
    <div className="budgets-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title font-display">Budget Health & Thresholds</h1>
          <p className="page-subtitle">
            Configure target category spending limits and monitor automated warning thresholds.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedBudget(null);
              setModalOpen(true);
            }}
          >
            <PlusCircle size={16} />
            <span>Set Category Budget</span>
          </button>
        </div>
      </div>

      {/* Aggregate Budget Progress Banner */}
      <div className="glass-panel aggregate-budget-banner">
        <div className="aggregate-left">
          <div className="aggregate-metric">
            <span className="aggregate-label">Total Monthly Budget</span>
            <span className="aggregate-value font-display">
              {currency}{totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="aggregate-divider" />
          <div className="aggregate-metric">
            <span className="aggregate-label">Current Month Spend</span>
            <span className="aggregate-value font-display text-rose">
              {currency}{totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="aggregate-divider" />
          <div className="aggregate-metric">
            <span className="aggregate-label">Budget Pacing</span>
            <span
              className={`aggregate-value font-display ${overallPct > 100 ? 'text-rose' : overallPct >= 80 ? 'text-amber' : 'text-emerald'}`}
            >
              {overallPct}%
            </span>
          </div>
        </div>

        <div className="aggregate-right">
          <div className="progress-bar-container" style={{ height: 12 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, overallPct)}%`,
                backgroundColor:
                  overallPct > 100 ? '#f43f5e' : overallPct >= 80 ? '#f59e0b' : '#10b981',
              }}
            />
          </div>
        </div>
      </div>

      {/* Budgets Grid */}
      <div className="budgets-grid">
        {budgets.length === 0 ? (
          <div className="glass-panel empty-budgets-card">
            <Target size={40} className="empty-budget-icon" />
            <h3 className="empty-title font-display">No Budget Limits Configured</h3>
            <p className="empty-desc">
              Setting monthly budgets helps you prevent overspending and gives you early warnings when approaching limits.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedBudget(null);
                setModalOpen(true);
              }}
            >
              <PlusCircle size={16} />
              <span>Create Your First Budget</span>
            </button>
          </div>
        ) : (
          budgets.map((b) => {
            const pct = b.percentage_used;
            const isExceeded = b.status === 'exceeded';
            const isWarning = b.status === 'warning';

            const statusColor = isExceeded ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981';
            const statusBadgeClass = isExceeded
              ? 'badge-exceeded'
              : isWarning
              ? 'badge-warning'
              : 'badge-safe';

            return (
              <div key={b.id} className="glass-panel budget-card">
                <div className="budget-card-header">
                  <div>
                    <h3 className="budget-category-title">{b.category}</h3>
                    <span className={`badge ${statusBadgeClass}`}>
                      {isExceeded ? (
                        <>
                          <ShieldAlert size={12} /> Exceeded
                        </>
                      ) : isWarning ? (
                        <>
                          <AlertCircle size={12} /> Near Limit (≥80%)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} /> On Track
                        </>
                      )}
                    </span>
                  </div>

                  <div className="budget-actions">
                    <button
                      className="btn-action-icon edit"
                      onClick={() => {
                        setSelectedBudget(b);
                        setModalOpen(true);
                      }}
                      title="Edit monthly limit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn-action-icon delete"
                      onClick={() => handleDeleteBudget(b.id)}
                      title="Remove budget"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Numbers */}
                <div className="budget-amounts-row">
                  <div>
                    <span className="budget-amount-label">Spent</span>
                    <div className="budget-amount-val font-display" style={{ color: statusColor }}>
                      {currency}{b.spent_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="budget-amount-label">Monthly Target</span>
                    <div className="budget-amount-val font-display">
                      {currency}{b.monthly_limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: statusColor,
                    }}
                  />
                </div>

                {/* Footer status text */}
                <div className="budget-card-footer">
                  <span className="budget-pct-text">{pct}% used</span>
                  <span className="budget-remaining-text">
                    {isExceeded
                      ? `${currency}${(b.spent_amount - b.monthly_limit).toFixed(2)} over limit`
                      : `${currency}${b.remaining_amount.toFixed(2)} available`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBudget(null);
        }}
        onSubmit={handleSaveBudget}
        initialBudget={selectedBudget}
        currency={currency}
      />
    </div>
  );
}
