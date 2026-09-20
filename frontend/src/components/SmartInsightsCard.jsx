import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';

export default function SmartInsightsCard({ insights = [] }) {
  const typeIcons = {
    success: { icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    danger: { icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' },
    info: { icon: Info, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  };

  return (
    <div className="glass-panel smart-insights-card">
      <div className="insights-header">
        <div className="insights-header-left">
          <div className="sparkle-badge">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="chart-title font-display">Smart Financial Insights</h3>
            <p className="chart-subtitle">Automated intelligence & spending anomalies</p>
          </div>
        </div>
      </div>

      <div className="insights-list">
        {insights.length === 0 ? (
          <div className="chart-empty-state" style={{ height: 100 }}>
            Analyzing spending data for insights...
          </div>
        ) : (
          insights.map((ins, index) => {
            const conf = typeIcons[ins.type] || typeIcons.info;
            const Icon = conf.icon;
            return (
              <div key={ins.id || index} className="insight-item">
                <div
                  className="insight-icon-box"
                  style={{ backgroundColor: conf.bg, color: conf.color }}
                >
                  <Icon size={18} />
                </div>
                <div className="insight-content">
                  <div className="insight-title-row">
                    <span className="insight-title">{ins.title}</span>
                    {ins.metric && (
                      <span
                        className="insight-metric-pill"
                        style={{ color: conf.color, backgroundColor: conf.bg }}
                      >
                        {ins.metric}
                      </span>
                    )}
                  </div>
                  <p className="insight-message">{ins.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
