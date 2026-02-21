import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastData {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastProps {
    toasts: ToastData[];
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: ToastData; onRemove: (id: string) => void }> = ({
    toast,
    onRemove,
}) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Mount animation
        const showTimer = setTimeout(() => setVisible(true), 10);
        // Auto-remove after 4s
        const removeTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
        }, 4000);
        return () => {
            clearTimeout(showTimer);
            clearTimeout(removeTimer);
        };
    }, [toast.id, onRemove]);

    const isError = toast.type === 'error';

    return (
        <div
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 max-w-xs ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${isError
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
        >
            {isError ? (
                <XCircle size={18} className="shrink-0 text-red-500" />
            ) : (
                <CheckCircle size={18} className="shrink-0 text-emerald-500" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={() => onRemove(toast.id)}
                className={`shrink-0 rounded-md p-0.5 transition-colors ${isError ? 'hover:bg-red-100 text-red-400' : 'hover:bg-emerald-100 text-emerald-400'
                    }`}
            >
                <X size={14} />
            </button>
        </div>
    );
};
