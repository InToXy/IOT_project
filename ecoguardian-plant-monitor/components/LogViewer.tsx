import React, { useEffect, useState, useRef } from 'react';
import { logger, LogEntry, LogLevel } from '../services/LogService';

interface LogViewerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<LogLevel | 'all'>('all');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Subscribe to log updates
        const unsubscribe = logger.subscribe((newLogs) => {
            setLogs(newLogs);
        });
        return unsubscribe;
    }, []);

    const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 w-full max-w-5xl h-[80vh] rounded-xl shadow-2xl flex flex-col border border-slate-700 overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                    <h2 className="text-xl font-mono text-emerald-400 font-bold flex items-center gap-2">
                        <span className="text-2xl">⚡</span> System Logs
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                            {(['all', 'info', 'success', 'warn', 'error'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors uppercase ${filter === f
                                            ? 'bg-slate-700 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => logger.clear()}
                            className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Clear Logs"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Log Content */}
                <div className="flex-1 overflow-auto p-4 bg-[#0d1117] font-mono text-sm" ref={scrollRef}>
                    {filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600">
                            <span className="text-4xl mb-4">📝</span>
                            <p>No logs to display</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredLogs.map((log) => (
                                <div key={log.id} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors group">
                                    <span className="text-slate-500 shrink-0 w-24">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                                    </span>
                                    <span className={`shrink-0 w-20 font-bold uppercase text-xs flex items-center ${log.level === 'info' ? 'text-blue-400' :
                                            log.level === 'success' ? 'text-emerald-400' :
                                                log.level === 'warn' ? 'text-amber-400' :
                                                    'text-rose-500'
                                        }`}>
                                        {log.level}
                                    </span>
                                    <div className="flex-1 text-slate-300 break-all">
                                        {log.message}
                                        {log.data && (
                                            <pre className="mt-1 text-xs text-slate-500 bg-black/30 p-2 rounded overflow-x-auto">
                                                {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-500 flex justify-between px-4">
                    <span>Total: {logs.length} events</span>
                    <span>EcoGuardian Logger v1.0</span>
                </div>
            </div>
        </div>
    );
};
