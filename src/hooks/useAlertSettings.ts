import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'serpic_alert_settings_v1';
const EVENT = 'alert-settings-updated';

export interface AlertSettings {
  /** Days in advance to warn about an expiring guarantee. */
  garantiasDays: number;
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = { garantiasDays: 30 };

export const readAlertSettings = (): AlertSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ALERT_SETTINGS;
    const parsed = JSON.parse(raw);
    const days = Number(parsed?.garantiasDays);
    return { garantiasDays: Number.isFinite(days) && days >= 0 ? days : DEFAULT_ALERT_SETTINGS.garantiasDays };
  } catch {
    return DEFAULT_ALERT_SETTINGS;
  }
};

export const useAlertSettings = () => {
  const [settings, setSettings] = useState<AlertSettings>(() => readAlertSettings());

  useEffect(() => {
    const handler = () => setSettings(readAlertSettings());
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const saveSettings = useCallback((next: AlertSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSettings(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { settings, saveSettings };
};
