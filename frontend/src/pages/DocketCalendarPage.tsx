import React, { useState } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { MS, MSS, dDiff } from '../utils/helpers';
import { DocketEvent } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

const EC: Record<string, string> = {
  Hearing: 'pr',
  'FER Deadline': 'gd',
  'Renewal Due': 'gd',
  'Opposition Deadline': 'rd',
  'Court Date': 'pr',
  'Filing Deadline': 'rd',
  'Arbitration Sitting': 'gd',
  'Written Arguments': 'cy',
  Mediation: 'gn',
};

export const DocketCalendarPage: React.FC = () => {
  const { deadlines, openModal, syncDriveAndCalendar, showToast } = useLawyersDiary();

  const [calY, setCalY] = useState(() => new Date().getFullYear());
  const [calM, setCalM] = useState(() => new Date().getMonth());

  const handleNav = (delta: number) => {
    let newM = calM + delta;
    let newY = calY;
    if (newM > 11) {
      newM = 0;
      newY++;
    } else if (newM < 0) {
      newM = 11;
      newY--;
    }
    setCalM(newM);
    setCalY(newY);
  };

  const firstDayIndex = new Date(calY, calM, 1).getDay();
  const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(calY, calM + 1, 0).getDate();
  const daysInPrevMonth = new Date(calY, calM, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const now = new Date();

  const calendarCells = [];
  let dayCounter = 1;

  for (let i = 0; i < totalCells; i++) {
    let dNumber: number;
    let isCurrentMonth = true;

    if (i < offset) {
      dNumber = daysInPrevMonth - offset + i + 1;
      isCurrentMonth = false;
    } else if (dayCounter > daysInMonth) {
      dNumber = dayCounter - daysInMonth;
      dayCounter++;
      isCurrentMonth = false;
    } else {
      dNumber = dayCounter;
      dayCounter++;
    }

    const dateString = isCurrentMonth
      ? `${calY}-${String(calM + 1).padStart(2, '0')}-${String(dNumber).padStart(2, '0')}`
      : '';

    const isToday =
      isCurrentMonth &&
      dNumber === now.getDate() &&
      calM === now.getMonth() &&
      calY === now.getFullYear();

    const dayEvents = dateString ? deadlines.filter((d) => d.date === dateString) : [];

    calendarCells.push({
      key: i,
      dNumber,
      isCurrentMonth,
      isToday,
      dateString,
      events: dayEvents,
    });
  }

  const upcomingMonthEvents = [...deadlines]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  const renderDeadlineRow = (d: DocketEvent) => {
    const dt = new Date(d.date);
    const diff = dDiff(d.date);
    const pc = d.priority === 'ug' ? 'ug' : d.priority === 'wa' ? 'wa' : 'ok';
    const lbl =
      diff === null
        ? '—'
        : diff === 0
        ? 'TODAY'
        : diff === 1
        ? 'Tomorrow'
        : diff < 0
        ? 'OVERDUE'
        : `${diff} days`;
    const dc = diff !== null && diff <= 3 ? 'du' : diff !== null && diff <= 14 ? 'dw' : 'dok';

    return (
      <div
        key={d.id}
        className={`di ${pc}`}
        onClick={() => {
          if (d.matterId) openModal('matter-detail', d.matterId);
        }}
      >
        <div className="dbox">
          <div className="dday">{dt.getDate()}</div>
          <div className="dmon">{MSS[dt.getMonth()]}</div>
        </div>
        <div className="dinfo">
          <div className="dtitle">
            {d.type} – {d.matterName}
          </div>
          <div className="dsub">
            <span style={{ fontWeight: 500 }}>{d.attorney}</span>
            {d.venue ? ` · ${d.venue}` : ''}
          </div>
        </div>
        <span className={`ddys ${dc}`}>{lbl}</span>
      </div>
    );
  };

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-slate-800" />
            <h1>Master Docket &amp; Court Calendar</h1>
          </div>
          <p>Real-time cause dates, limitation deadlines, and statutory appearances across jurisdictions</p>
        </div>
        <div className="pa">
          <button className="btn btn-o btn-s" onClick={syncDriveAndCalendar}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Google Calendar</span>
          </button>
          <button className="btn btn-p btn-s" onClick={() => openModal('add-docket')}>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Docket Event</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Calendar Grid Card */}
        <div className="cd">
          <div className="ch">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button className="btn btn-g btn-s" onClick={() => handleNav(-1)} title="Previous Month">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="ct2" id="cal-t" style={{ minWidth: '130px', textAlign: 'center' }}>
                {MS[calM]} {calY}
              </span>
              <button className="btn btn-g btn-s" onClick={() => handleNav(1)} title="Next Month">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span className="chip pr">Courts</span>
              <span className="chip gd">IPR FER</span>
              <span className="chip rd">Statutory Due</span>
              <span className="chip gn">Mediation</span>
              <span className="chip cy">Tribunal</span>
            </div>
          </div>

          <div className="cb" style={{ padding: '1rem' }}>
            {/* Weekdays */}
            <div className="cg" id="cal-hd">
              <div className="chr">Mon</div>
              <div className="chr">Tue</div>
              <div className="chr">Wed</div>
              <div className="chr">Thu</div>
              <div className="chr">Fri</div>
              <div className="chr">Sat</div>
              <div className="chr">Sun</div>
            </div>

            {/* Month Day Cells */}
            <div className="cg" id="cal-bd">
              {calendarCells.map((cell) => (
                <div
                  key={cell.key}
                  className={`cc ${!cell.isCurrentMonth ? 'ot' : ''} ${
                    cell.isToday ? 'td' : ''
                  }`}
                  onClick={() => {
                    if (cell.events.length > 0) {
                      const desc = cell.events
                        .map((e) => `• [${e.type}] ${e.matterName} (${e.time || '10:30 AM'})`)
                        .join('\n');
                      showToast(`${cell.events.length} event(s) scheduled on ${cell.dateString}`, 'in');
                      alert(`${cell.dateString}\n\n${desc}`);
                    }
                  }}
                  title={
                    cell.events.length > 0
                      ? cell.events.map((e) => `${e.type}: ${e.matterName}`).join('; ')
                      : undefined
                  }
                >
                  <div className="cn">{cell.dNumber}</div>
                  {cell.events.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className={`ce ${EC[e.type] || 'gd'}`}
                      title={`${e.type}: ${e.matterName}`}
                    >
                      {e.type.substring(0, 12)}
                    </div>
                  ))}
                  {cell.events.length > 2 && (
                    <div className="ce" style={{ background: 'var(--bg)', color: 'var(--tx2)', fontWeight: 600 }}>
                      +{cell.events.length - 2} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Upcoming this month */}
          <div className="cd">
            <div className="ch">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock className="w-4 h-4 text-slate-700" />
                <span className="ct2">Upcoming Appearances</span>
              </div>
            </div>
            <div className="cb" id="cal-up">
              {upcomingMonthEvents.length > 0 ? (
                <div className="dl2">{upcomingMonthEvents.map(renderDeadlineRow)}</div>
              ) : (
                <div className="em">
                  <p>No upcoming docket events.</p>
                </div>
              )}
            </div>
          </div>

          {/* Google Calendar Card */}
          <div className="cd">
            <div className="ch">
              <span className="ct2">Google Calendar Sync</span>
              <span className="chip gn">Connected</span>
            </div>
            <div className="cb">
              <div className="ib gn" style={{ marginBottom: '0.75rem' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span style={{ fontSize: '0.78rem' }}>
                  Live 2-way sync enabled. Court listings &amp; tribunal causes sync to counsel calendars automatically.
                </span>
              </div>
              <button
                className="btn btn-o btn-s"
                style={{ width: '100%', marginBottom: '0.5rem' }}
                onClick={syncDriveAndCalendar}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Force Calendar Sync</span>
              </button>
              <button
                className="btn btn-g btn-s"
                style={{ width: '100%' }}
                onClick={() => window.open('https://calendar.google.com', '_blank')}
              >
                <span>Open Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
