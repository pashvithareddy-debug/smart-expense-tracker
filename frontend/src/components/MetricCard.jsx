import React from 'react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'emerald', // emerald | rose | violet | cyan
  badgeText,
}) {
  const colorStyles = {
    emerald: {
      bgIcon: 'rgba(16, 185, 129, 0.15)',
      colorIcon: '#10b981',
      borderGlow: 'rgba(16, 185, 129, 0.25)',
    },
    rose: {
      bgIcon: 'rgba(244, 63, 94, 0.15)',
      colorIcon: '#f43f5e',
      borderGlow: 'rgba(244, 63, 94, 0.25)',
    },
    violet: {
      bgIcon: 'rgba(139, 92, 246, 0.15)',
      colorIcon: '#8b5cf6',
      borderGlow: 'rgba(139, 92, 246, 0.25)',
    },
    cyan: {
      bgIcon: 'rgba(6, 182, 212, 0.15)',
      colorIcon: '#06b6d4',
      borderGlow: 'rgba(6, 182, 212, 0.25)',
    },
  };

  const scheme = colorStyles[colorScheme] || colorStyles.emerald;

  return (
    <div className="glass-panel metric-card">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && (
          <div
            className="metric-icon-box"
            style={{
              background: scheme.bgIcon,
              color: scheme.colorIcon,
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="metric-value font-display">{value}</div>

      <div className="metric-footer">
        {badgeText && (
          <span
            className="metric-badge"
            style={{
              background: scheme.bgIcon,
              color: scheme.colorIcon,
            }}
          >
            {badgeText}
          </span>
        )}
        {subtitle && <span className="metric-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
