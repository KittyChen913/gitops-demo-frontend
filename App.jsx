const { useState, useEffect, useRef, useCallback } = React;

const VERSION_POLL_MS = 4000;
const HEALTH_POLL_MS  = 5000;

const STATUS_LABELS = {
  version: { ok: 'Connected',  err: 'Disconnected', idle: 'Connecting…' },
  health:  { ok: 'Healthy',    err: 'Unhealthy',     idle: 'Checking…'  },
};

function usePolling(fn, interval) {
  useEffect(() => {
    fn();
    if (!interval) return;
    const id = setInterval(fn, interval);
    return () => clearInterval(id);
  }, [fn, interval]);
}

function App() {
  // ── /version ──────────────────────────────────────────
  const [service,        setService]        = useState('—');
  const [version,        setVersion]        = useState('—');
  const [versionMsg,     setVersionMsg]     = useState('Connecting…');
  const [versionStatus,  setVersionStatus]  = useState('idle'); // 'ok' | 'err' | 'idle'
  const [versionError,   setVersionError]   = useState('');
  const [lastUpdated,    setLastUpdated]    = useState('');
  const [flash,          setFlash]          = useState(false);
  const prevVersionRef = useRef(null);

  // ── /health ───────────────────────────────────────────
  const [healthStatus, setHealthStatus] = useState('idle'); // 'ok' | 'err' | 'idle'
  const [healthError,  setHealthError]  = useState('');

  // ── /meta (optional) ──────────────────────────────────
  // null = not yet fetched, false = not available, object = data
  const [meta, setMeta] = useState(null);

  // ── Fetch /version ────────────────────────────────────
  const fetchVersion = useCallback(async () => {
    try {
      const res = await fetch('/version');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      const newVersion = String(data.version ?? 'N/A');
      if (prevVersionRef.current !== null && prevVersionRef.current !== newVersion) {
        setFlash(false);
        setTimeout(() => setFlash(true), 0);
      }
      prevVersionRef.current = newVersion;

      setService(String(data.service ?? '—'));
      setVersion(newVersion);
      setVersionMsg(String(data.message ?? '—'));
      setVersionStatus('ok');
      setVersionError('');
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setVersionStatus('err');
      setVersionError(err.message);
      setLastUpdated('');
    }
  }, []);

  // ── Fetch /health ─────────────────────────────────────
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/health');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const s = String(data.status ?? '').toLowerCase();
      setHealthStatus(s === 'ok' ? 'ok' : 'err');
      setHealthError('');
    } catch (err) {
      setHealthStatus('err');
      setHealthError(err.message);
    }
  }, []);

  // ── Fetch /meta (once, optional) ──────────────────────
  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch('/meta');
      if (res.status === 404) { setMeta(false); return; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setMeta(await res.json());
    } catch {
      setMeta(false);
    }
  }, []);

  usePolling(fetchVersion, VERSION_POLL_MS);
  usePolling(fetchHealth,  HEALTH_POLL_MS);
  usePolling(fetchMeta,    null);

  const handleRefresh = useCallback(() => {
    fetchVersion();
    fetchHealth();
    fetchMeta();
  }, [fetchVersion, fetchHealth, fetchMeta]);

  // ── Derived labels ─────────────────────────────────────
  const healthLabel = STATUS_LABELS.health[healthStatus]   ?? 'Checking…';

  const connLabel   = STATUS_LABELS.version[versionStatus] ?? 'Connecting…';

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="container">
      <header className="header">
        <h1>GitOps Observer</h1>
        <p>Live deployment changes via Argo&nbsp;CD</p>
      </header>

      {/* ── Version Card ── */}
      <div className="card">
        <div className="card-row">
          <div>
            <div className="card-label">Service</div>
            <div className="service-name">{service}</div>
          </div>
          <div className="divider-v" />
          <div className="version-block">
            <div className="card-label">Version</div>
            <div
              className={`version${flash ? ' flash' : ''}`}
              onAnimationEnd={() => setFlash(false)}
            >
              {version}
            </div>
          </div>
        </div>
        <div className="card-label" style={{ marginTop: '1.25rem' }}>Message</div>
        <div className="message">{versionMsg}</div>
        {versionError && <div className="error-msg">{versionError}</div>}
      </div>

      {/* ── Health Card ── */}
      <div className="card">
        <div className="card-label">Health</div>
        <div className={`health-badge ${healthStatus}`}>
          <span className={`dot ${healthStatus}`} />
          {healthLabel}
        </div>
        {healthError && <div className="error-msg">{healthError}</div>}
      </div>

      {/* ── Meta Card (optional) ── */}
      {meta && (
        <div className="card">
          <div className="card-label">Build Info</div>
          <div className="meta-row">
            <span className="meta-key">Commit</span>
            <span className="meta-value mono">{meta.commit ?? '—'}</span>
          </div>
        </div>
      )}

      {/* ── Status Bar ── */}
      <div className="status-bar">
        <div className="status-indicator">
          <span className={`dot ${versionStatus !== 'idle' ? versionStatus : ''}`} />
          <span>{connLabel}</span>
        </div>
        {lastUpdated && <div className="last-updated">Updated: {lastUpdated}</div>}
      </div>

      <button
        className="btn-refresh"
        onClick={handleRefresh}
      >
        &#8635;&nbsp;Refresh
      </button>
      <div className="poll-hint">Polls every 4 s (version) &middot; 5 s (health)</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
