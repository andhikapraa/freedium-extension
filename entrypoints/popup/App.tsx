import { useEffect, useState } from 'react';
import './App.css';

const DEFAULT_URL = 'https://freedium-mirror.cfd';

function App() {
  const [enabled, setEnabled] = useState(true);
  const [redirectCount, setRedirectCount] = useState(0);
  const [redirectUrl, setRedirectUrl] = useState(DEFAULT_URL);
  const [urlInput, setUrlInput] = useState(DEFAULT_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    browser.storage.local
      .get(['enabled', 'redirectCount', 'redirectUrl'])
      .then((data: Record<string, unknown>) => {
        if (typeof data.enabled === 'boolean') setEnabled(data.enabled);
        if (typeof data.redirectCount === 'number')
          setRedirectCount(data.redirectCount);
        if (typeof data.redirectUrl === 'string') {
          setRedirectUrl(data.redirectUrl);
          setUrlInput(data.redirectUrl);
        }
      });
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await browser.storage.local.set({ enabled: next });
  };

  const resetCount = async () => {
    setRedirectCount(0);
    await browser.storage.local.set({ redirectCount: 0 });
  };

  const saveUrl = async () => {
    let url = urlInput.trim();
    if (!url) url = DEFAULT_URL;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    url = url.replace(/\/+$/, '');
    setRedirectUrl(url);
    setUrlInput(url);
    await browser.storage.local.set({ redirectUrl: url });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const resetUrl = async () => {
    setRedirectUrl(DEFAULT_URL);
    setUrlInput(DEFAULT_URL);
    await browser.storage.local.set({ redirectUrl: DEFAULT_URL });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="popup">
      <div className="header">
        <div className="brand">
          <img src="/icon.svg" className="brand-icon" alt="Freedium" />
          <span className="brand-name">Freedium</span>
        </div>
        <div className="header-right">
          <span className={`status-badge ${enabled ? 'active' : 'inactive'}`}>
            {enabled ? 'Active' : 'Paused'}
          </span>
          <button
            className={`settings-btn ${showSettings ? 'open' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.07 1.29a1 1 0 0 1 1.86 0l.53 1.32a1 1 0 0 0 .78.6l1.43.15a1 1 0 0 1 .57 1.76l-1.1.93a1 1 0 0 0-.33.96l.32 1.4a1 1 0 0 1-1.5 1.09l-1.23-.73a1 1 0 0 0-1.02 0l-1.23.73a1 1 0 0 1-1.5-1.09l.32-1.4a1 1 0 0 0-.33-.96l-1.1-.93A1 1 0 0 1 4.1 3.36l1.43-.15a1 1 0 0 0 .78-.6l.53-1.32zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6.5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="toggle-section">
        <div className="toggle-info">
          <span className="toggle-label">Redirect Medium</span>
          <span className="toggle-desc">
            → {new URL(redirectUrl).hostname}
          </span>
        </div>
        <button
          className={`toggle-switch ${enabled ? 'on' : 'off'}`}
          onClick={toggle}
          role="switch"
          aria-checked={enabled}
        >
          <span className="toggle-knob" />
        </button>
      </div>

      {showSettings && (
        <div className="settings-section">
          <label className="settings-label">Redirect URL</label>
          <div className="url-input-row">
            <input
              type="text"
              className="url-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveUrl()}
              placeholder={DEFAULT_URL}
              spellCheck={false}
            />
          </div>
          <div className="settings-actions">
            <button className="btn btn-secondary" onClick={resetUrl}>
              Reset
            </button>
            <button className="btn btn-primary" onClick={saveUrl}>
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="stats">
        <div className="stat-card">
          <span className="stat-number">{redirectCount}</span>
          <span className="stat-label">Articles freed</span>
        </div>
        <button className="reset-btn" onClick={resetCount} title="Reset counter">
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2 8a6 6 0 0 1 10.3-4.2L11 5h4V1l-1.6 1.6A8 8 0 1 0 16 8h-2a6 6 0 0 1-12 0z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default App;
