import React, { useState, useEffect } from 'react';
import { X, Target, Check, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

const COMMON_BUDGET_CATEGORIES = [
  { name: 'Housing & Rent', icon: '🏠', color: '#6366f1' },
  { name: 'Groceries & Markets', icon: '🛒', color: '#10b981' },
  { name: 'Dining & Cafes', icon: '🍽️', color: '#f59e0b' },
  { name: 'Utilities & Internet', icon: '💡', color: '#06b6d4' },
  { name: 'Entertainment & Tech', icon: '🎬', color: '#8b5cf6' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
  { name: 'Health & Wellness', icon: '💊', color: '#ec4899' },
  { name: 'Shopping', icon: '🛍️', color: '#f97316' },
  { name: 'Travel & Vacation', icon: '✈️', color: '#14b8a6' },
  { name: 'Education & Courses', icon: '📚', color: '#a855f7' },
  { name: 'Personal Care', icon: '✨', color: '#eab308' },
];

const QUICK_LIMITS = [150, 300, 500, 1000, 1500];

export default function BudgetModal({
  isOpen,
  onClose,
  onSubmit,
  initialBudget = null,
  currency = '$',
}) {
  const [category, setCategory] = useState(COMMON_BUDGET_CATEGORIES[0].name);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialBudget) {
      const match = COMMON_BUDGET_CATEGORIES.find((c) => c.name === initialBudget.category);
      if (match) {
        setCategory(initialBudget.category);
        setIsCustom(false);
      } else {
        setIsCustom(true);
        setCustomCategory(initialBudget.category);
      }
      setMonthlyLimit(String(initialBudget.monthly_limit));
    } else {
      setCategory(COMMON_BUDGET_CATEGORIES[0].name);
      setCustomCategory('');
      setIsCustom(false);
      setMonthlyLimit('');
    }
    setError('');
  }, [initialBudget, isOpen]);

  if (!isOpen) return null;

  const handleQuickLimit = (val) => {
    setMonthlyLimit(String(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const limitVal = parseFloat(monthlyLimit);
    if (isNaN(limitVal) || limitVal <= 0) {
      setError('Please enter a valid monthly spending budget.');
      return;
    }

    const finalCategory = isCustom ? customCategory.trim() : category;
    if (!finalCategory) {
      setError('Category cannot be blank.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(finalCategory, limitVal, initialBudget?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save budget target');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-type-indicator budget">
              <Target size={20} />
            </div>
            <div>
              <h3 className="modal-title font-display">
                {initialBudget ? 'Adjust Category Budget' : 'Set Category Budget Limit'}
              </h3>
              <p className="modal-subtitle">
                Establish spending caps to prevent budget overruns
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Target Amount Hero Display */}
          <div className="hero-amount-box budget-focus">
            <span className="hero-amount-currency">{currency}</span>
            <input
              type="number"
              step="1"
              min="1"
              className="hero-amount-input font-display"
              placeholder="0"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              required
              autoFocus
            />
            <span className="hero-amount-period">/ month</span>
          </div>

          {/* Quick Limit Pills */}
          <div className="quick-amount-row">
            <span className="quick-amount-label">Presets:</span>
            {QUICK_LIMITS.map((val) => (
              <button
                key={val}
                type="button"
                className="quick-amount-chip"
                onClick={() => handleQuickLimit(val)}
              >
                {currency}{val}
              </button>
            ))}
          </div>

          {/* Category Picker */}
          <div className="form-group" style={{ marginTop: 12 }}>
            <div className="category-label-row">
              <label className="form-label">Category</label>
              {!initialBudget && (
                <div className="budget-type-selector">
                  <button
                    type="button"
                    className={`budget-select-pill ${!isCustom ? 'active' : ''}`}
                    onClick={() => setIsCustom(false)}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    className={`budget-select-pill ${isCustom ? 'active' : ''}`}
                    onClick={() => setIsCustom(true)}
                  >
                    Custom Category
                  </button>
                </div>
              )}
            </div>

            {isCustom ? (
              <input
                type="text"
                className="form-control"
                placeholder="Enter custom category name (e.g. Pet Care, Gaming, Subscriptions)"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                disabled={!!initialBudget}
              />
            ) : (
              <div className="category-chips-grid">
                {COMMON_BUDGET_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      className={`category-chip ${isSelected ? 'selected' : ''}`}
                      style={{
                        borderColor: isSelected ? cat.color : undefined,
                        backgroundColor: isSelected ? `${cat.color}22` : undefined,
                      }}
                      onClick={() => setCategory(cat.name)}
                      disabled={!!initialBudget}
                    >
                      <span className="category-chip-emoji">{cat.icon}</span>
                      <span className="category-chip-name">{cat.name}</span>
                      {isSelected && <Check size={13} className="category-chip-check" style={{ color: cat.color }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Threshold Explanation Strip */}
          <div className="threshold-info-strip">
            <div className="threshold-pill-guide">
              <span className="badge badge-safe">
                <ShieldCheck size={12} /> Under 80% Safe
              </span>
              <span className="badge badge-warning">
                <AlertTriangle size={12} /> 80%+ Warning
              </span>
              <span className="badge badge-exceeded">
                <ShieldAlert size={12} /> 100%+ Exceeded
              </span>
            </div>
            <p className="threshold-explanation">
              The smart expense engine continuously monitors spending pace and warns you before you exceed target allocations.
            </p>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-submit-transaction"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : initialBudget ? 'Update Budget' : 'Activate Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
