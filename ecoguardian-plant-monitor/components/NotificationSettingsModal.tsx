import React from 'react';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { BellIcon } from './Icons';

interface NotificationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
    const { settings, toggleMaster, toggleType } = useNotificationSettings();

    // Manual state handling inside component to reflect changes immediately is tricky if the hook syncs with localStorage.
    // The hook in React 18 might not trigger re-renders if multiple instances are used unless we use a context or global state.
    // For simplicity, we assume this modal is the only place changing settings.
    // But wait, the hook reads from localStorage only on mount.
    // To make settings reactive across components (ToastContainer vs Modal), we need a custom event or context.
    // For now, let's just make sure ToastContainer reads from localStorage on every potential toast *OR* uses a custom event.
    // Actually, dispatching a storage event works for cross-tab, but for same-tab we need a listener.
    // Let's modify the hook to listen to window 'storage' or a custom event.

    // RE-INVENTING THE HOOK for better reactivity:
    // See updated hook content below this file creation.

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <BellIcon className="w-5 h-5 text-indigo-500" />
                        Notifications
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Master Switch */}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium text-slate-900 dark:text-slate-100 block">Activer les notifications</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Afficher les alertes temporaires</span>
                        </div>
                        <button
                            onClick={toggleMaster}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-700" />

                    {/* Types */}
                    <div className={`space-y-3 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.types.error}
                                onChange={() => toggleType('error')}
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-slate-700 dark:text-slate-300">Erreurs (Critique)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.types.warn}
                                onChange={() => toggleType('warn')}
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-slate-700 dark:text-slate-300">Avertissements</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.types.success}
                                onChange={() => toggleType('success')}
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-slate-700 dark:text-slate-300">Succès (Confirmations)</span>
                        </label>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 text-center">
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                        Terminé
                    </button>
                </div>
            </div>
        </div>
    );
};
