import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald" />,
    error: <AlertCircle size={18} className="text-rose" />,
    info: <Info size={18} className="text-cyan" />,
  };

  return (
    <div className={`toast-notification glass-panel toast-${toast.type || 'info'}`}>
      <div className="toast-icon-wrapper">
        {icons[toast.type] || icons.info}
      </div>
      <div className="toast-message-content">
        <div className="toast-title">{toast.title || (toast.type === 'error' ? 'Notice' : 'Success')}</div>
        <div className="toast-body">{toast.message}</div>
      </div>
      <button className="toast-close-btn" onClick={onClose}>
        <X size={15} />
      </button>
    </div>
  );
}
