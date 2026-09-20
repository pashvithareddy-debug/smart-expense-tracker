import React, { useState, useEffect } from 'react';
import { PlusCircle, Download, ArrowLeftRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import TransactionTable from '../components/TransactionTable';
import TransactionModal from '../components/TransactionModal';
import { txAPI, analyticsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function TransactionsPage({ onOpenAddTx, showToast }) {
  const { user } = useAuth();
  const currency = user?.currency || '$';

  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [editingTx, setEditingTx] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const data = await txAPI.list({
        search,
        category: categoryFilter,
        transaction_type: typeFilter,
        limit: 200,
        sort_by: 'date',
        sort_order: 'desc',
      });
      setTransactions(data.transactions || []);
      setTotalCount(data.total_count || 0);
      setTotalIncome(data.total_income || 0);
      setTotalExpense(data.total_expense || 0);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await analyticsAPI.getCategories();
      const uniqueCats = Array.from(new Set(cats.map((c) => c.category)));
      setAvailableCategories(uniqueCats);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [search, categoryFilter, typeFilter]);

  const handleCreateOrUpdate = async (formData) => {
    if (editingTx) {
      await txAPI.update(editingTx.id, formData);
      showToast?.(`Transaction "${formData.title}" updated.`, 'success', 'Updated');
    } else {
      await txAPI.create(formData);
      showToast?.(`Transaction "${formData.title}" recorded.`, 'success', 'Recorded');
    }
    fetchTransactions();
    fetchCategories();
    setIsModalOpen(false);
    setEditingTx(null);
  };

  const handleEditClick = (tx) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (txId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await txAPI.delete(txId);
        showToast?.('Transaction deleted successfully.', 'info', 'Deleted');
        fetchTransactions();
        fetchCategories();
      } catch (err) {
        showToast?.(err.message || 'Failed to delete transaction', 'error', 'Error');
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      await txAPI.exportCSV();
      showToast?.('Transaction CSV export downloaded.', 'success', 'Export Ready');
    } catch (err) {
      showToast?.(err.message || 'Error exporting CSV', 'error', 'Export Failed');
    }
  };

  return (
    <div className="transactions-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title font-display">Transaction Ledger</h1>
          <p className="page-subtitle">
            Track, filter, search, and audit your complete financial cash movements.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTx(null);
              setIsModalOpen(true);
            }}
          >
            <PlusCircle size={16} />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Ledger KPI Summary Chips */}
      <div className="ledger-summary-strip glass-panel">
        <div className="ledger-summary-item">
          <span className="summary-label">Total Transactions</span>
          <span className="summary-value font-display">{totalCount}</span>
        </div>
        <div className="summary-divider" />
        <div className="ledger-summary-item">
          <span className="summary-label">Total Inflow</span>
          <span className="summary-value font-display text-emerald">
            +{currency}{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-divider" />
        <div className="ledger-summary-item">
          <span className="summary-label">Total Outflow</span>
          <span className="summary-value font-display text-rose">
            -{currency}{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-divider" />
        <div className="ledger-summary-item">
          <span className="summary-label">Net Liquidity</span>
          <span
            className={`summary-value font-display ${totalIncome - totalExpense >= 0 ? 'text-emerald' : 'text-rose'}`}
          >
            {totalIncome - totalExpense >= 0 ? '+' : ''}{currency}
            {(totalIncome - totalExpense).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Transaction Table */}
      <TransactionTable
        transactions={transactions}
        currency={currency}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        onExportCSV={handleExportCSV}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        availableCategories={availableCategories}
      />

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingTx}
        currency={currency}
      />
    </div>
  );
}
