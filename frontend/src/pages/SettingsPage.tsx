import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const language = 'en';
  const setLanguage = (_v: string) => {};
  const [notifications, setNotifications] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: '1px solid rgba(0,0,0,0.1)',
    }}>
      <span style={{ fontSize: '13px' }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '48px',
          height: '26px',
          background: checked ? 'var(--c5)' : 'var(--mid)',
          border: '2px solid var(--ink)',
          borderRadius: '13px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
          padding: 0,
        }}
      >
        <div style={{
          width: '18px',
          height: '18px',
          background: checked ? 'var(--c1)' : 'var(--c4)',
          border: '2px solid var(--ink)',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: checked ? '24px' : '2px',
          transition: 'all 0.2s',
        }}></div>
      </button>
    </div>
  );

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">SETTINGS</h1>
            <p className="ch-desc">Configure your Petal experience</p>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: '24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Account */}
          <div style={{ border: '4px solid var(--ink)' }}>
            <div style={{ background: 'var(--c5)', padding: '14px 20px', borderBottom: '3px solid var(--ink)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c1)' }}>Account</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', display: 'block', marginBottom: '6px', letterSpacing: '1px' }}>EMAIL</label>
                <div style={{ padding: '12px', background: 'var(--paper)', border: '2px solid var(--ink)', fontSize: '14px' }}>
                  {user?.email || 'Not signed in'}
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  padding: '12px 24px',
                  background: 'var(--c3)',
                  border: '2px solid var(--ink)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div style={{ border: '4px solid var(--ink)' }}>
            <div style={{ background: 'var(--c4)', padding: '14px 20px', borderBottom: '3px solid var(--ink)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c1)' }}>Notifications</span>
            </div>
            <div style={{ padding: '0 20px' }}>
              <ToggleSwitch checked={notifications} onChange={setNotifications} label="In-app notifications" />
              <ToggleSwitch checked={emailNotifs} onChange={setEmailNotifs} label="Email notifications" />
              <ToggleSwitch checked={soundEnabled} onChange={setSoundEnabled} label="Sound effects" />
            </div>
          </div>

          {/* Preferences */}
          <div style={{ border: '4px solid var(--ink)' }}>
            <div style={{ background: 'var(--c3)', padding: '14px 20px', borderBottom: '3px solid var(--ink)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink)' }}>Preferences</span>
            </div>
            <div style={{ padding: '0 20px' }}>
              <ToggleSwitch checked={autoSave} onChange={setAutoSave} label="Auto-save notes" />
              <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>LANGUAGE</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid var(--ink)',
                    background: 'var(--paper)',
                    fontFamily: 'var(--sans)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ border: '4px solid #ef4444' }}>
            <div style={{ background: '#fef2f2', padding: '14px 20px', borderBottom: '3px solid #ef4444' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#ef4444' }}>Danger Zone</span>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--c5)', marginBottom: '12px' }}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button style={{
                padding: '10px 20px',
                background: '#ef4444',
                color: 'white',
                border: '2px solid #991b1b',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
              }}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SettingsPage;