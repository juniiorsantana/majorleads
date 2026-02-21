import { useState, useCallback } from 'react';
import type { ToastData, ToastType } from '../components/Toast';

let toastCounter = 0;

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'error') => {
        const id = `toast-${++toastCounter}`;
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
};
