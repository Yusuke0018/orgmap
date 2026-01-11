'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Global toast state
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function updateToasts(newToasts: Toast[]) {
  toasts = newToasts;
  toastListeners.forEach((listener) => listener(toasts));
}

export function toast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = Math.random().toString(36).substring(7);
  const newToast: Toast = { id, message, type, duration };
  updateToasts([...toasts, newToast]);

  if (duration > 0) {
    setTimeout(() => {
      updateToasts(toasts.filter((t) => t.id !== id));
    }, duration);
  }

  return id;
}

toast.success = (message: string, duration = 3000) => toast(message, 'success', duration);
toast.error = (message: string, duration = 5000) => toast(message, 'error', duration);
toast.info = (message: string, duration = 3000) => toast(message, 'info', duration);
toast.warning = (message: string, duration = 4000) => toast(message, 'warning', duration);

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts([...newToasts]);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    updateToasts(toasts.filter((t) => t.id !== id));
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {currentToasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[var(--success)]" />,
    error: <AlertCircle className="w-5 h-5 text-[var(--danger)]" />,
    info: <Info className="w-5 h-5 text-[var(--primary)]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />,
  };

  const backgrounds = {
    success: 'border-l-4 border-l-[var(--success)]',
    error: 'border-l-4 border-l-[var(--danger)]',
    info: 'border-l-4 border-l-[var(--primary)]',
    warning: 'border-l-4 border-l-[var(--warning)]',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 bg-white rounded-lg shadow-lg px-4 py-3 min-w-[280px] max-w-md animate-slide-in',
        backgrounds[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-[var(--text-primary)]">{toast.message}</p>
      <button
        onClick={onClose}
        className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
