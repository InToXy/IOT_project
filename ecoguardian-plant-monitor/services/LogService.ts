
export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
    id: string;
    timestamp: number;
    level: LogLevel;
    message: string;
    data?: any;
}

type LogListener = (logs: LogEntry[]) => void;

class LogService {
    private logs: LogEntry[] = [];
    private listeners: LogListener[] = [];
    private maxLogs = 200;

    constructor() {
        this.fetchLogs();
    }

    private async fetchLogs() {
        try {
            const response = await fetch('/api/logs');
            if (response.ok) {
                const fetchedLogs: LogEntry[] = await response.json();
                if (Array.isArray(fetchedLogs)) {
                    // Merge fetched logs with existing logs, avoiding duplicates by ID
                    const existingIds = new Set(this.logs.map(l => l.id));
                    const newLogsFromBackend = fetchedLogs.filter(l => !existingIds.has(l.id));

                    // Combine and sort by timestamp (newest first)
                    this.logs = [...this.logs, ...newLogsFromBackend].sort((a, b) => b.timestamp - a.timestamp);

                    // Limit to maxLogs
                    this.logs = this.logs.slice(0, this.maxLogs);

                    this.notify();
                }
            }
        } catch (error) {
            console.error("Failed to fetch logs from backend", error);
        }
    }

    private notify() {
        this.listeners.forEach(listener => listener([...this.logs]));
    }

    private addLog(level: LogLevel, message: string, data?: any) {
        const entry: LogEntry = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            level,
            message,
            data
        };

        console.log(`[${level.toUpperCase()}] ${message}`, data ? data : '');

        this.logs = [entry, ...this.logs].slice(0, this.maxLogs);
        this.notify();

        // Send to backend
        fetch('/api/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entry)
        }).catch(err => {
            // Sliently fail if backend is down to avoid loops or noise
            console.error("Failed to send log to backend", err);
        });
    }

    public info(message: string, data?: any) {
        this.addLog('info', message, data);
    }

    public success(message: string, data?: any) {
        this.addLog('success', message, data);
    }

    public warn(message: string, data?: any) {
        this.addLog('warn', message, data);
    }

    public error(message: string, data?: any) {
        this.addLog('error', message, data);
    }

    public getLogs(): LogEntry[] {
        return [...this.logs];
    }

    public clear() {
        this.logs = [];
        this.notify();
    }

    public subscribe(listener: LogListener): () => void {
        this.listeners.push(listener);
        listener([...this.logs]); // Initial call
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

export const logger = new LogService();
