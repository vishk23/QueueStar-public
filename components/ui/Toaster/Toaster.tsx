'use client';

import React from 'react';
import { useUI } from '@/contexts/UIContext';

export const Toaster: React.FC = () => {
  const { toasts, hideToast } = useUI();

  if (toasts.length === 0) return null;

  return (
    <div className="toast toast-top toast-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`alert ${
            toast.type === 'success' ? 'alert-success' : 
            toast.type === 'error' ? 'alert-error' :
            toast.type === 'warning' ? 'alert-warning' : 
            'alert-info'
          }`}
        >
          <div>
            <h3 className="font-bold">{toast.title}</h3>
            {toast.message && <div className="text-xs">{toast.message}</div>}
          </div>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => hideToast(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};