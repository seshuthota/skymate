'use client';

import { useState } from 'react';

export default function DevBar() {
  const [uid, setUid] = useState('user_dev_1');
  const [status, setStatus] = useState<string>('');

  async function login() {
    await fetch(`/api/dev-login?uid=${encodeURIComponent(uid)}`);
    setStatus(`Logged in as ${uid}`);
  }
  async function logout() {
    await fetch('/api/dev-logout');
    setStatus('Logged out');
  }

  return (
    <div className="card pad" style={{ marginTop: 16 }}>
      <div className="stack">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge">Dev Login</span>
            <input className="input" style={{ width: 220 }} value={uid} onChange={(e) => setUid(e.target.value)} placeholder="uid" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={login}>Set Cookie</button>
            <button className="btn" onClick={logout}>Logout</button>
          </div>
        </div>
        {status && <div className="mt-2" style={{ color: 'var(--muted)' }}>{status}</div>}
      </div>
    </div>
  );
}
