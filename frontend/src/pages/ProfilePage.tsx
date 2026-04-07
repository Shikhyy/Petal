import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || 'User');
  const [bio, setBio] = useState('');

  const stats = [
    { label: 'Tasks Completed', value: '142' },
    { label: 'Events Created', value: '38' },
    { label: 'Notes Written', value: '127' },
    { label: 'Agent Interactions', value: '1.2K' },
  ];

  const achievements = [
    { icon: '🚀', title: 'Early Adopter', desc: 'Joined in the first wave', unlocked: true },
    { icon: '📝', title: 'Knowledge Keeper', desc: 'Created 100+ notes', unlocked: true },
    { icon: '⚡', title: 'Power User', desc: '1000+ agent actions', unlocked: true },
    { icon: '🎯', title: 'Task Master', desc: 'Completed 100 tasks', unlocked: true },
    { icon: '📅', title: 'Scheduler', desc: 'Created 50+ events', unlocked: false },
    { icon: '🏆', title: 'Champion', desc: 'Used Petal for 30 days straight', unlocked: false },
  ];

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">PROFILE</h1>
            <p className="ch-desc">Your account details and achievements</p>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: '24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Profile Header */}
          <div style={{
            border: '4px solid var(--ink)',
            background: 'var(--c1)',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '32px',
            marginBottom: '24px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'var(--c5)',
              border: '4px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontFamily: 'var(--display)',
              color: 'var(--c1)',
              flexShrink: 0,
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              {editing ? (
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => setEditing(false)}
                  style={{
                    fontFamily: 'var(--display)',
                    fontSize: '32px',
                    letterSpacing: '1px',
                    border: 'none',
                    borderBottom: '3px solid var(--ink)',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    marginBottom: '4px',
                  }}
                />
              ) : (
                <h2
                  onClick={() => setEditing(true)}
                  style={{
                    fontFamily: 'var(--display)',
                    fontSize: '32px',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    marginBottom: '4px',
                  }}
                >
                  {displayName}
                </h2>
              )}
              <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>{user?.email}</p>
              {bio ? (
                <p style={{ fontSize: '13px', color: 'var(--c5)', marginTop: '8px' }}>{bio}</p>
              ) : (
                <p
                  onClick={() => setBio('Add a bio...')}
                  style={{ fontSize: '13px', color: 'var(--c4)', marginTop: '8px', cursor: 'pointer', fontStyle: 'italic' }}
                >
                  Add a bio...
                </p>
              )}
            </div>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                padding: '8px 16px',
                background: 'var(--c5)',
                color: 'var(--c1)',
                border: '2px solid var(--ink)',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {editing ? 'SAVE' : 'EDIT'}
            </button>
          </div>

          {/* Stats */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--c5)', marginBottom: '12px' }}>Your Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', border: '4px solid var(--ink)' }}>
              {stats.map((stat, i) => (
                <div key={i} style={{
                  padding: '20px',
                  borderRight: i < 3 ? '2px solid var(--ink)' : 'none',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '36px', lineHeight: '1', color: 'var(--c5)' }}>{stat.value}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c5)', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h3 style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--c5)', marginBottom: '12px' }}>Achievements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {achievements.map((ach, i) => (
                <div key={i} style={{
                  border: '3px solid var(--ink)',
                  background: ach.unlocked ? 'var(--c2)' : 'var(--mid)',
                  padding: '20px',
                  textAlign: 'center',
                  opacity: ach.unlocked ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{ach.icon}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>{ach.title}</div>
                  <div style={{ fontSize: '10px', color: 'var(--c5)' }}>{ach.desc}</div>
                  {ach.unlocked && (
                    <div style={{
                      marginTop: '8px',
                      fontFamily: 'var(--mono)',
                      fontSize: '9px',
                      padding: '2px 6px',
                      background: 'var(--c3)',
                      border: '1.5px solid var(--ink)',
                      display: 'inline-block',
                    }}>UNLOCKED</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;