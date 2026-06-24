'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';

interface Settings {
  splash_screen_enabled: boolean;
}

export function SiteSettingsManager() {
  const [settings, setSettings] = useState<Settings>({ splash_screen_enabled: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/site-settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings({ splash_screen_enabled: data.splash_screen_enabled !== 'false' });
        setLoading(false);
      });
  }, []);

  const toggle = async (key: keyof Settings) => {
    const next = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: next }));
    setSaving(true);
    await fetch('/api/admin/site-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key === 'splash_screen_enabled' ? 'splash_screen_enabled' : key]: next ? 'true' : 'false' }),
    });
    setSaving(false);
  };

  if (loading) return <p className={styles.loading}>로딩 중...</p>;

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>사이트 설정</h2>
      <div className={styles.settingRow}>
        <div>
          <strong>스플래시 스크린</strong>
          <p className={styles.settingDesc}>사이트 로딩 시 BROSPICK 로고 화면을 표시합니다.</p>
        </div>
        <button
          className={settings.splash_screen_enabled ? styles.toggleOn : styles.toggleOff}
          onClick={() => toggle('splash_screen_enabled')}
          disabled={saving}
        >
          {settings.splash_screen_enabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
