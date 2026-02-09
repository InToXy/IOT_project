
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
        // Load from local storage if needed, but for now we'll keep it in memory
        // to avoid cluttering storage with old logs on reload.
        // If persistence is needed, we can uncomment this:
        // const saved = localStorage.getItem('app_logs');
        // if (saved) this.logs = JSON.parse(saved);
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
        // Use relative URL assuming proxy or same host, but here we hardcode for dev/docker
        // In production, this should be configurable.
        // Assuming Vite proxy or direct access.
        // For Docker, browser accesses localhost:3001 mapped.
        fetch('http://localhost:3001/api/logs', {
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
