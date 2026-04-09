import { useState, useEffect } from 'react';
import { createEvent, getEvents } from '../utils/api';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDate, setQuickDate] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0).toISOString();

    getEvents(start, end)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.start_time.startsWith(dateStr));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const upcomingEvents = events
    .filter(e => new Date(e.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  const handleQuickAdd = async () => {
    setQuickMessage('');
    if (!quickTitle.trim() || !quickDate) {
      setQuickMessage('Add a title and date first.');
      return;
    }

    setQuickLoading(true);
    try {
      const start = new Date(`${quickDate}T09:00:00`).toISOString();
      const end = new Date(`${quickDate}T09:30:00`).toISOString();
      await createEvent({ title: quickTitle.trim(), start_time: start, end_time: end });
      setQuickTitle('');
      setQuickDate('');
      setQuickMessage('Event created.');
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const refreshed = await getEvents(
        new Date(year, month, 1).toISOString(),
        new Date(year, month + 1, 0).toISOString()
      );
      setEvents(refreshed);
    } catch {
      setQuickMessage('Calendar is unavailable right now.');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="cal-container">
      <div className="cal-main-panel">
        <div className="cal-nav-bar">
          <button className="cal-nav-btn" onClick={prevMonth}>←</button>
          <span className="cal-month-txt">{MONTHS[month]} {year}</span>
          <button className="cal-nav-btn" onClick={nextMonth}>→</button>
        </div>
        <div className="cal-days-header">
          {DAYS.map((d) => (
            <div key={d} className="cdh">{d}</div>
          ))}
        </div>
        <div className="cal-grid-days">
          {cells.map((day, i) => {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const dayEvents = day ? getEventsForDay(day) : [];

            return (
              <div key={i} className={`cal-day-cell ${isToday ? 'today' : ''} ${!day ? 'faded' : ''} ${dayEvents.length > 0 ? 'has-ev' : ''}`}>
                {day && (
                  <>
                    <span>{day}</span>
                    {dayEvents.length > 0 && <span className="ev-pip"></span>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="cal-side-cards">
        <div className="event-panel">
          <div className="ep-header">Upcoming Events</div>
          <div className="ep-body">
            {upcomingEvents.length === 0 ? (
              <div style={{ fontSize: '11px', opacity: 0.6 }}>No upcoming events</div>
            ) : (
              upcomingEvents.map((ev) => (
                <div key={ev.id} className="ev-row">
                  <div className="ev-time">
                    {new Date(ev.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  <div className="ev-bar"></div>
                  <div className="ev-info">
                    <div className="ev-name">{ev.title}</div>
                    {ev.location && <div className="ev-loc">{ev.location}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="event-panel">
          <div className="ep-header">Quick Add</div>
          <div className="ep-body">
            <input 
              type="text" 
              placeholder="Event title..." 
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              style={{ width: '100%', marginBottom: '8px', fontSize: '11px' }}
            />
            <input 
              type="date" 
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              style={{ width: '100%', marginBottom: '8px', fontSize: '11px' }}
            />
            <button onClick={handleQuickAdd} disabled={quickLoading} style={{ width: '100%', fontSize: '10px', padding: '6px' }}>
              {quickLoading ? 'ADDING...' : 'ADD EVENT'}
            </button>
            {quickMessage && <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>{quickMessage}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
