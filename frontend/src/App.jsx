import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import TransactionModal from './components/TransactionModal';
import Toast from './components/Toast';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { txAPI } from './api/client';
import { ExternalLink, Terminal, CheckCircle2 } from 'lucide-react';

function MainApp() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGlobalAddOpen, setIsGlobalAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success', title = '') => {
    setToast({ message, type, title });
  };

  if (loading) {
    return (
      <div className="auth-page-wrapper">
        <div className="dashboard-loading-spinner">
          <div className="spinner-glow" />
          <span className="loading-text font-display">Initializing Financial Telemetry...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleGlobalCreateTx = async (formData) => {
    await txAPI.create(formData);
    showToast(
      `${formData.title} (${user?.currency || '$'}${parseFloat(formData.amount).toFixed(2)}) recorded successfully.`,
      'success',
      'Transaction Logged'
    );
    // Force re-render of current view
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddTx={() => setIsGlobalAddOpen(true)}
      />

      {/* Main View Area */}
      <main className="main-content" key={refreshKey}>
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenAddTx={() => setIsGlobalAddOpen(true)}
            onNavigateTransactions={() => setActiveTab('transactions')}
            showToast={showToast}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsPage
            onOpenAddTx={() => setIsGlobalAddOpen(true)}
            showToast={showToast}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsPage showToast={showToast} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage />
        )}
      </main>

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={isGlobalAddOpen}
        onClose={() => setIsGlobalAddOpen(false)}
        onSubmit={handleGlobalCreateTx}
        currency={user?.currency || '$'}
      />

      {/* Footer */}
      <footer className="footer-container">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>Smart Expense Tracker PRO</span>
            <span>•</span>
            <span>FastAPI + PostgreSQL + React + Recharts</span>
          </div>

          <div className="footer-links">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="footer-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Terminal size={14} />
              <span>Swagger API Docs</span>
              <ExternalLink size={12} />
            </a>
            <span style={{ color: '#475569' }}>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#10b981' }}>
              <CheckCircle2 size={13} />
              <span>System Operational</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
