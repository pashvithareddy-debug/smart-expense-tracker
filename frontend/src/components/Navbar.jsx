import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  PlusCircle,
  LogOut,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenAddTx }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon-wrapper">
            <Wallet className="brand-icon" size={22} />
          </div>
          <div>
            <div className="brand-title">
              SmartExpense <span className="brand-badge">PRO</span>
            </div>
            <div className="brand-subtitle">Financial Intelligence</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="navbar-actions">
          <button className="btn btn-primary btn-sm" onClick={onOpenAddTx}>
            <PlusCircle size={16} />
            <span>New Transaction</span>
          </button>

          {/* User Profile */}
          <div className="user-profile-pill">
            <div className="user-avatar">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-currency">({user?.currency || '$'})</span>
            </div>
            <button
              className="btn-logout"
              onClick={logout}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
