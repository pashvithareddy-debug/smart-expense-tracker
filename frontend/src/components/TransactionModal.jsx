import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Check,
  Tag,
  FileText,
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
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
  { name: 'Other Expense', icon: '📦', color: '#94a3b8' },
];

const INCOME_CATEGORIES = [
  { name: 'Salary', icon: '💼', color: '#10b981' },
  { name: 'Freelance & Consulting', icon: '💻', color: '#6366f1' },
  { name: 'Dividends & Investments', icon: '📈', color: '#06b6d4' },
  { name: 'Business Revenue', icon: '🏢', color: '#8b5cf6' },
  { name: 'Rental Income', icon: '🏘️', color: '#f59e0b' },
  { name: 'Gifts & Grants', icon: '🎁', color: '#ec4899' },
  { name: 'Other Income', icon: '💵', color: '#14b8a6' },
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI / App', icon: Smartphone },
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'bank_transfer', label: 'Transfer', icon: Building },
];

const QUICK_AMOUNTS = [10, 25, 50, 100, 250];

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  currency = '$',
}) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    transaction_type: 'expense',
    category: EXPENSE_CATEGORIES[0].name,
    payment_method: 'card',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        amount: initialData.amount ? String(initialData.amount) : '',
        transaction_type: initialData.transaction_type || 'expense',
        category: initialData.category || EXPENSE_CATEGORIES[0].name,
        payment_method: initialData.payment_method || 'card',
        date: initialData.date ? initialData.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        transaction_type: 'expense',
        category: EXPENSE_CATEGORIES[0].name,
        payment_method: 'card',
        date: new Date().toISOString().slice(0, 10),
        notes: '',
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTypeChange = (newType) => {
    const defaultCat = newType === 'income' ? INCOME_CATEGORIES[0].name : EXPENSE_CATEGORIES[0].name;
    setFormData((prev) => ({
      ...prev,
      transaction_type: newType,
      category: defaultCat,
    }));
  };

  const handleAddAmount = (addVal) => {
    const current = parseFloat(formData.amount) || 0;
    setFormData((prev) => ({
      ...prev,
      amount: String(Math.round((current + addVal) * 100) / 100),
    }));
  };

  const setDatePreset = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setFormData((prev) => ({
      ...prev,
      date: d.toISOString().slice(0, 10),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please provide a title or description.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        amount: amt,
        transaction_type: formData.transaction_type,
        category: formData.category,
        payment_method: formData.payment_method,
        date: new Date(formData.date).toISOString(),
        notes: formData.notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const isIncome = formData.transaction_type === 'income';
  const categoriesList = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className={`modal-type-indicator ${isIncome ? 'income' : 'expense'}`}>
              {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            </div>
            <div>
              <h3 className="modal-title font-display">
                {initialData ? 'Edit Transaction' : 'Record Transaction'}
              </h3>
              <p className="modal-subtitle">
                {isIncome ? 'Log money earned or received' : 'Track an expense outflow'}
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Close (Esc)">
            <X size={20} />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Segmented Type Switcher */}
          <div className="type-toggle-container modern-toggle">
            <button
              type="button"
              className={`type-toggle-btn ${!isIncome ? 'active-expense' : ''}`}
              onClick={() => handleTypeChange('expense')}
            >
              <ArrowDownRight size={16} />
              <span>Expense (Outflow)</span>
            </button>
            <button
              type="button"
              className={`type-toggle-btn ${isIncome ? 'active-income' : ''}`}
              onClick={() => handleTypeChange('income')}
            >
              <ArrowUpRight size={16} />
              <span>Income (Inflow)</span>
            </button>
          </div>

          {/* Hero Amount Field */}
          <div className={`hero-amount-box ${isIncome ? 'income-focus' : 'expense-focus'}`}>
            <span className="hero-amount-sign">{isIncome ? '+' : '-'}</span>
            <span className="hero-amount-currency">{currency}</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="hero-amount-input font-display"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              autoFocus
            />
          </div>

          {/* Quick Amount Additive Pills */}
          <div className="quick-amount-row">
            <span className="quick-amount-label">Quick add:</span>
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                className="quick-amount-chip"
                onClick={() => handleAddAmount(val)}
              >
                +{currency}{val}
              </button>
            ))}
            {formData.amount && (
              <button
                type="button"
                className="quick-amount-chip clear-btn"
                onClick={() => setFormData({ ...formData, amount: '' })}
              >
                Clear
              </button>
            )}
          </div>

          {/* Description Title */}
          <div className="form-group">
            <label className="form-label">
              <span>Title / Merchant / Description</span>
              <span className="required-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <FileText size={16} className="input-field-icon" />
              <input
                type="text"
                className="form-control with-icon"
                placeholder={isIncome ? 'e.g. Monthly Salary, Freelance project, Dividend' : 'e.g. Whole Foods Groceries, Blue Bottle Coffee, Rent'}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Category Picker: Visual Chips */}
          <div className="form-group">
            <div className="category-label-row">
              <label className="form-label">Select Category</label>
              <span className="category-selected-badge font-display">
                {formData.category}
              </span>
            </div>
            <div className="category-chips-grid">
              {categoriesList.map((cat) => {
                const isSelected = formData.category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    className={`category-chip ${isSelected ? 'selected' : ''}`}
                    style={{
                      borderColor: isSelected ? cat.color : undefined,
                      backgroundColor: isSelected ? `${cat.color}22` : undefined,
                    }}
                    onClick={() => setFormData({ ...formData, category: cat.name })}
                  >
                    <span className="category-chip-emoji">{cat.icon}</span>
                    <span className="category-chip-name">{cat.name}</span>
                    {isSelected && <Check size={13} className="category-chip-check" style={{ color: cat.color }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method & Date Row */}
          <div className="grid-modal-2col">
            {/* Payment Method Pills */}
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div className="payment-pills-row">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = formData.payment_method === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      className={`payment-pill-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, payment_method: pm.id })}
                    >
                      <Icon size={14} />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date with Quick Presets */}
            <div className="form-group">
              <div className="date-header-row">
                <label className="form-label">Transaction Date</label>
                <div className="date-presets">
                  <button
                    type="button"
                    className="date-preset-btn"
                    onClick={() => setDatePreset(0)}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="date-preset-btn"
                    onClick={() => setDatePreset(1)}
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <div className="input-icon-wrapper">
                <Calendar size={16} className="input-field-icon" />
                <input
                  type="date"
                  className="form-control with-icon date-control"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Add optional context, receipt details, tax tag, or reference number..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Modal Action Buttons */}
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
              className={`btn ${isIncome ? 'btn-success' : 'btn-danger'} btn-submit-transaction`}
              disabled={submitting}
            >
              {submitting
                ? 'Saving...'
                : initialData
                ? 'Update Transaction'
                : isIncome
                ? 'Record Income'
                : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
