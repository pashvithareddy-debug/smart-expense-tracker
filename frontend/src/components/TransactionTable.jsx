import React from 'react';
import {
  Search,
  Download,
  Filter,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
} from 'lucide-react';

export default function TransactionTable({
  transactions = [],
  currency = '$',
  search = '',
  onSearchChange,
  categoryFilter = 'All',
  onCategoryFilterChange,
  typeFilter = '',
  onTypeFilterChange,
  onExportCSV,
  onEdit,
  onDelete,
  availableCategories = [],
}) {
  const getMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote size={14} title="Cash" />;
      case 'upi':
        return <Smartphone size={14} title="UPI" />;
      case 'bank_transfer':
        return <Building size={14} title="Bank Transfer" />;
      default:
        return <CreditCard size={14} title="Card" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="glass-panel table-panel">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="table-filters-left">
          {/* Search Input */}
          <div className="table-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="table-search-input"
              placeholder="Search by title, category, or notes..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <select
            className="table-filter-select"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
          >
            <option value="All">All Categories</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Type Filter Buttons */}
          <div className="table-type-tabs">
            <button
              className={`type-tab-pill ${typeFilter === '' ? 'active' : ''}`}
              onClick={() => onTypeFilterChange('')}
            >
              All
            </button>
            <button
              className={`type-tab-pill ${typeFilter === 'income' ? 'active-income' : ''}`}
              onClick={() => onTypeFilterChange('income')}
            >
              Income
            </button>
            <button
              className={`type-tab-pill ${typeFilter === 'expense' ? 'active-expense' : ''}`}
              onClick={() => onTypeFilterChange('expense')}
            >
              Expenses
            </button>
          </div>
        </div>

        {/* Toolbar Right */}
        <div className="table-filters-right">
          <button className="btn btn-secondary btn-sm" onClick={onExportCSV} title="Download CSV report">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Category</th>
              <th>Method</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center', width: 90 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="table-empty-state">
                    No matching transactions found. Try adjusting your filters or record a new transaction.
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isIncome = tx.transaction_type === 'income';
                return (
                  <tr key={tx.id} className="table-row">
                    <td>
                      <div className="tx-cell-title">
                        <div className={`tx-type-icon-circle ${isIncome ? 'income' : 'expense'}`}>
                          {isIncome ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                        </div>
                        <div>
                          <div className="tx-title-text">{tx.title}</div>
                          {tx.notes && <div className="tx-notes-text">{tx.notes}</div>}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}>
                        {tx.category}
                      </span>
                    </td>

                    <td>
                      <span className="payment-method-pill">
                        {getMethodIcon(tx.payment_method)}
                        <span className="method-text">{tx.payment_method || 'card'}</span>
                      </span>
                    </td>

                    <td className="tx-date-cell">{formatDate(tx.date)}</td>

                    <td style={{ textAlign: 'right' }}>
                      <span className={`tx-amount-value font-display ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                        {isIncome ? '+' : '-'}{currency}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td>
                      <div className="tx-actions-cell">
                        <button
                          className="btn-action-icon edit"
                          onClick={() => onEdit(tx)}
                          title="Edit transaction"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-action-icon delete"
                          onClick={() => onDelete(tx.id)}
                          title="Delete transaction"
                        >
                          <Trash2 size={15} />
                        </button>
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
  );
}
