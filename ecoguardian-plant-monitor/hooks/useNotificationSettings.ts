import { useState, useEffect } from 'react';

export interface NotificationSettings {
    enabled: boolean;
    types: {
        error: boolean;
        warn: boolean;
        success: boolean;
        info: boolean;
    };
}

const DEFAULT_SETTINGS: NotificationSettings = {
    enabled: true,
    types: {
        error: true,
        warn: true,
        success: true,
        info: false
    }
};

const STORAGE_KEY = 'ecoguardian_notification_settings';
const EVENT_KEY = 'notification-settings-changed';

export const useNotificationSettings = () => {
    // Initial load function
    const loadSettings = (): NotificationSettings => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            } catch (e) {
                console.error("Failed to parse notification settings", e);
            }
        }
        return DEFAULT_SETTINGS;
    };

    const [settings, setSettings] = useState<NotificationSettings>(loadSettings);

    useEffect(() => {
        const handleStorageChange = () => {
            setSettings(loadSettings());
        };

        window.addEventListener(EVENT_KEY, handleStorageChange);
        window.addEventListener('storage', handleStorageChange); // Cross-tab

        return () => {
            window.removeEventListener(EVENT_KEY, handleStorageChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const updateSettings = (newSettings: NotificationSettings) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings); // Update local state immediately
        window.dispatchEvent(new Event(EVENT_KEY)); // Notify others
    };

    const toggleMaster = () => {
        const current = loadSettings();
        updateSettings({ ...current, enabled: !current.enabled });
    };

    const toggleType = (type: keyof NotificationSettings['types']) => {
        const current = loadSettings();
        const newTypes = { ...current.types, [type]: !current.types[type] };
        updateSettings({ ...current, types: newTypes });
    };

    return { settings, toggleMaster, toggleType };
};
