import React, { useEffect, useState } from 'react';
import { logger, LogEntry } from '../services/LogService';
import { useNotificationSettings } from '../hooks/useNotificationSettings';

const TOAST_DURATION = 5000;

interface Toast extends LogEntry {
    visible: boolean;
}

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const { settings } = useNotificationSettings();

    useEffect(() => {
        let lastLogId: string | null = null;

        const unsubscribe = logger.subscribe((logs) => {
            if (logs.length === 0) return;
            const newest = logs[0]; // Assuming newest first

            if (newest.id !== lastLogId) {
                lastLogId = newest.id;

                // --- FILTER LOGIC ---
                if (!settings.enabled) return;

                // Type check
                // Map log level to settings key (error -> error, warn -> warn, success -> success)
                // Assuming levels match exactly, but 'info' might be used for success sometimes or vice versa.
                // In LogService we have 'info', 'warn', 'error', 'success'.
                const type = newest.level as keyof typeof settings.types;
                if (!settings.types[type]) return;

                addToast(newest);
            }
        });
        return unsubscribe;
    }, [settings]); // Re-subscribe when settings change

    const addToast = (log: LogEntry) => {
        setToasts(prev => [{ ...log, visible: true }, ...prev].slice(0, 5)); // Keep max 5 toasts

        // Auto remove
        setTimeout(() => {
            removeToast(log.id);
        }, TOAST_DURATION);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
        // Actually remove from array after animation
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
    };

    return (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-80 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
            pointer-events-auto transform transition-all duration-300 ease-in-out
            ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            p-4 rounded-lg shadow-lg border border-white/10 backdrop-blur-md text-white
            ${toast.level === 'error' ? 'bg-rose-600/90' :
                            toast.level === 'warn' ? 'bg-amber-500/90' :
                                'bg-emerald-500/90'}
          `}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h4 className="font-bold text-sm uppercase mb-1">{toast.level}</h4>
                            <p className="text-sm opacity-90">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 text-white/50 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
