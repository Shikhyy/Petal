import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useNotes } from '../hooks/useNotes';
import { getApiErrorMessage, getEvents } from '../utils/api';
import { AppIcon } from '../components/AppIcon';

export function ProfilePage() {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { notes, loading: notesLoading, error: notesError } = useNotes();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('petal_profile_display_name') || user?.email?.split('@')[0] || 'User');
  const [bio, setBio] = useState(() => localStorage.getItem('petal_profile_bio') || '');
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [eventLoadError, setEventLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (displayName.trim()) {
      localStorage.setItem('petal_profile_display_name', displayName.trim());
    }
  }, [displayName]);

  useEffect(() => {
    localStorage.setItem('petal_profile_bio', bio);
  }, [bio]);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30).toISOString();
    setEventLoadError(null);

    getEvents(start, end)
      .then((events) => {
        const count = events.filter((event: any) => new Date(event.start_time).getTime() >= Date.now()).length;
        setUpcomingEvents(count);
      })
      .catch((err) => {
        setUpcomingEvents(0);
        setEventLoadError(getApiErrorMessage(err, 'Failed to load event stats.'));
      });
  }, []);

  const stats = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.status === 'done').length;
    const totalTaskEvents = tasks.length;
    const noteCount = notes.length;
    const interactions = totalTaskEvents + noteCount + upcomingEvents;
    return [
      { label: 'Tasks Completed', value: String(completedTasks) },
      { label: 'Upcoming Events', value: String(upcomingEvents) },
      { label: 'Notes Written', value: String(noteCount) },
      { label: 'Agent Interactions', value: String(interactions) },
    ];
  }, [tasks, notes, upcomingEvents]);

  const combinedError = tasksError || notesError || eventLoadError;

  const achievements = [
    { icon: 'rocket', title: 'Early Adopter', desc: 'Joined in the first wave', unlocked: true },
    { icon: 'note', title: 'Knowledge Keeper', desc: 'Created 100+ notes', unlocked: true },
    { icon: 'spark', title: 'Power User', desc: '1000+ agent actions', unlocked: true },
    { icon: 'target', title: 'Task Master', desc: 'Completed 100 tasks', unlocked: true },
    { icon: 'calendar', title: 'Scheduler', desc: 'Created 50+ events', unlocked: false },
    { icon: 'trophy', title: 'Champion', desc: 'Used Petal for 30 days straight', unlocked: false },
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
        {combinedError && (
          <div style={{ marginBottom: '14px', padding: '10px 12px', border: '2px solid var(--ink)', background: 'rgba(239,68,68,0.12)', color: '#991b1b', fontFamily: 'var(--mono)', fontSize: '11px' }}>
            {combinedError}
          </div>
        )}
        {saveMessage && (
          <div style={{ marginBottom: '14px', padding: '10px 12px', border: '2px solid var(--ink)', background: 'rgba(16,185,129,0.14)', color: '#065f46', fontFamily: 'var(--mono)', fontSize: '11px' }}>
            {saveMessage}
          </div>
        )}
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
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  style={{ width: '100%', marginTop: '8px', fontSize: '13px', color: 'var(--c5)', border: '2px solid var(--ink)', background: 'rgba(255,255,255,0.6)', padding: '8px', resize: 'vertical' }}
                />
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
              onClick={() => {
                setEditing(!editing);
                setSaveMessage(editing ? 'Profile saved.' : 'Editing profile.');
              }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0', border: '4px solid var(--ink)' }}>
              {(tasksLoading || notesLoading) && (
                <div style={{ gridColumn: '1 / -1', padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>
                  Loading stats...
                </div>
              )}
              {stats.map((stat, i) => (
                <div key={i} style={{
                  padding: '20px',
                  borderRight: i < stats.length - 1 ? '2px solid var(--ink)' : 'none',
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {achievements.map((ach, i) => (
                <div key={i} style={{
                  border: '3px solid var(--ink)',
                  background: ach.unlocked ? 'var(--c2)' : 'var(--mid)',
                  padding: '20px',
                  textAlign: 'center',
                  opacity: ach.unlocked ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px', margin: '0 auto 8px', color: ach.unlocked ? 'var(--ink)' : 'var(--c5)' }}>
                    <AppIcon name={ach.icon as any} size={24} />
                  </div>
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