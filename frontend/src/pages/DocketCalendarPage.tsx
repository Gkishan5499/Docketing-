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
  Mail,
  Download,
  AlertCircle,
  X,
  Sparkles,
  Check,
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

// Recognizable Google Calendar Branding Icon
const GoogleCalendarIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <rect x="3" y="4" width="18" height="18" rx="3.5" fill="#4285F4" />
    <path
      d="M3 8.5H21V19C21 20.6569 19.6569 22 18 22H6C4.34315 22 3 20.6569 3 19V8.5Z"
      fill="#FFFFFF"
    />
    <path d="M8 2V5" stroke="#1A73E8" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M16 2V5" stroke="#1A73E8" strokeWidth="2.2" strokeLinecap="round" />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="700"
      fill="#1A73E8"
      fontFamily="system-ui, sans-serif"
    >
      {new Date().getDate()}
    </text>
  </svg>
);

export const DocketCalendarPage: React.FC = () => {
  const {
    deadlines,
    openModal,
    syncDriveAndCalendar,
    showToast,
    googleCalendarEmail,
    googleCalendarSync,
    googleCalendarScope,
    setGoogleCalendarScope,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    openEventInGoogleCalendar,
    exportAllEventsToGoogleCalendar,
    subscribeGoogleCalendarFeed,
    currentEmail,
    currentUser,
  } = useLawyersDiary();

  const [calY, setCalY] = useState(() => new Date().getFullYear());
  const [calM, setCalM] = useState(() => new Date().getMonth());

  // Gmail connection state
  const [inputGmail, setInputGmail] = useState(() => {
    if (googleCalendarEmail) return googleCalendarEmail;
    if (currentEmail && currentEmail.toLowerCase().includes('@gmail.com')) return currentEmail;
    return '';
  });
  const [isEditingGmail, setIsEditingGmail] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedDayModal, setSelectedDayModal] = useState<{
    dateString: string;
    events: DocketEvent[];
  } | null>(null);

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

  const handleConnectGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGmail.trim()) {
      showToast('Please enter your Gmail address.', 'er');
      return;
    }
    setConnecting(true);
    await connectGoogleCalendar(inputGmail);
    setConnecting(false);
    setIsEditingGmail(false);
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

  // Filter upcoming events based on lawyer scope preference
  const filteredEvents = deadlines.filter((d) => {
    if (googleCalendarScope === 'assigned' && currentUser) {
      return (
        d.attorney === currentUser ||
        d.attorney === 'Self' ||
        d.attorney.toLowerCase().includes(currentUser.toLowerCase())
      );
    }
    return true;
  });

  const upcomingMonthEvents = [...filteredEvents]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  const nextUpcomingEvent = upcomingMonthEvents[0];

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
      <div key={d.id} className={`di ${pc}`} style={{ position: 'relative' }}>
        <div
          className="dbox"
          onClick={() => {
            if (d.matterId) openModal('matter-detail', d.matterId);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="dday">{dt.getDate()}</div>
          <div className="dmon">{MSS[dt.getMonth()]}</div>
        </div>
        <div
          className="dinfo"
          onClick={() => {
            if (d.matterId) openModal('matter-detail', d.matterId);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="dtitle">
            {d.type} – {d.matterName}
          </div>
          <div className="dsub">
            <span style={{ fontWeight: 500 }}>{d.attorney}</span>
            {d.venue ? ` · ${d.venue}` : ''}
            {d.time ? ` · ${d.time}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginLeft: 'auto' }}>
          <span className={`ddys ${dc}`}>{lbl}</span>
          <button
            type="button"
            className="btn btn-g btn-s"
            style={{
              padding: '0.24rem 0.45rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.72rem',
              background: 'var(--cd)',
              borderColor: 'var(--bd)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title={`Add to Google Calendar (${googleCalendarEmail || 'Gmail'})`}
            onClick={(e) => {
              e.stopPropagation();
              openEventInGoogleCalendar(d);
            }}
          >
            <GoogleCalendarIcon size={13} />
            <span style={{ fontWeight: 600, color: 'var(--tx)' }}>+ Cal</span>
          </button>
        </div>
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
          <p>
            Real-time cause dates, limitation deadlines, and statutory appearances synced to your
            Google Calendar
          </p>
        </div>
        <div className="pa" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            className="btn btn-o btn-s"
            onClick={() => exportAllEventsToGoogleCalendar()}
            title="Download .ics file to import into Google Calendar"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export (.ics)</span>
          </button>
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
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
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
                  className={`cc ${!cell.isCurrentMonth ? 'ot' : ''} ${cell.isToday ? 'td' : ''}`}
                  onClick={() => {
                    if (cell.events.length > 0) {
                      setSelectedDayModal({
                        dateString: cell.dateString,
                        events: cell.events,
                      });
                    }
                  }}
                  style={{ cursor: cell.events.length > 0 ? 'pointer' : 'default' }}
                  title={
                    cell.events.length > 0
                      ? `${cell.events.length} listings. Click to view & add to Google Calendar.`
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
                    <div
                      className="ce"
                      style={{ background: 'var(--bg)', color: 'var(--tx2)', fontWeight: 600 }}
                    >
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
          {/* Google Calendar & Gmail Sync Hub */}
          <div className="cd" style={{ borderTop: '3px solid #4285F4' }}>
            <div className="ch">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <GoogleCalendarIcon size={18} />
                <span className="ct2">Google Calendar Sync</span>
              </div>
              <span className={`chip ${googleCalendarSync ? 'gn' : 'rd'}`}>
                {googleCalendarSync ? 'Active Sync' : 'Not Connected'}
              </span>
            </div>

            <div className="cb">
              {googleCalendarSync && googleCalendarEmail && !isEditingGmail ? (
                <>
                  {/* Connected Status Card */}
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--tx2)', margin: 0 }}>
                            Connected Gmail ID
                          </p>
                          <strong
                            style={{
                              fontSize: '0.82rem',
                              color: 'var(--tx)',
                              wordBreak: 'break-all',
                            }}
                          >
                            {googleCalendarEmail}
                          </strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-g btn-s"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                        onClick={() => {
                          setInputGmail(googleCalendarEmail);
                          setIsEditingGmail(true);
                        }}
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Filter Scope Selector */}
                  <div style={{ marginBottom: '0.85rem' }}>
                    <p
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--tx2)',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Calendar Sync Scope:
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className={`btn btn-s ${
                          googleCalendarScope === 'all' ? 'btn-p' : 'btn-o'
                        }`}
                        style={{ flex: 1, fontSize: '0.72rem', padding: '0.3rem 0.4rem' }}
                        onClick={() => setGoogleCalendarScope('all')}
                      >
                        All Firm Cases
                      </button>
                      <button
                        type="button"
                        className={`btn btn-s ${
                          googleCalendarScope === 'assigned' ? 'btn-p' : 'btn-o'
                        }`}
                        style={{ flex: 1, fontSize: '0.72rem', padding: '0.3rem 0.4rem' }}
                        onClick={() => setGoogleCalendarScope('assigned')}
                        title={`Sync only cases assigned to ${currentUser || 'me'}`}
                      >
                        My Cases Only
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Next Court Date Quick Add */}
                  {nextUpcomingEvent && (
                    <div
                      style={{
                        background: 'var(--bg)',
                        border: '1px dashed var(--bd)',
                        borderRadius: '6px',
                        padding: '0.65rem 0.75rem',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.35rem',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: 'var(--pr)',
                              textTransform: 'uppercase',
                            }}
                          >
                            Next Court Date
                          </span>
                          <p
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: 'var(--tx)',
                              margin: '0.1rem 0 0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {nextUpcomingEvent.matterName}
                          </p>
                          <span style={{ fontSize: '0.7rem', color: 'var(--tx2)' }}>
                            {nextUpcomingEvent.date}
                            {nextUpcomingEvent.time ? ` at ${nextUpcomingEvent.time}` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-p btn-s"
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.3rem 0.55rem',
                            whiteSpace: 'nowrap',
                          }}
                          onClick={() => openEventInGoogleCalendar(nextUpcomingEvent)}
                          title="Draft this hearing in Google Calendar"
                        >
                          <GoogleCalendarIcon size={13} />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <button
                      className="btn btn-p btn-s"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={subscribeGoogleCalendarFeed}
                      title="Subscribe your Google Calendar to the live court docket feed"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Subscribe in Google Calendar</span>
                    </button>

                    <button
                      className="btn btn-o btn-s"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => exportAllEventsToGoogleCalendar()}
                      title="Download complete docket .ics file for Google Calendar"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Firm Docket (.ics)</span>
                    </button>

                    <button
                      className="btn btn-g btn-s"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => window.open('https://calendar.google.com', '_blank')}
                    >
                      <span>Open Google Calendar</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.75rem',
                      paddingTop: '0.6rem',
                      borderTop: '1px solid var(--bd)',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--tx2)' }}>
                      Auto-sync court alarms enabled
                    </span>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--rd)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onClick={disconnectGoogleCalendar}
                    >
                      Disconnect
                    </button>
                  </div>
                </>
              ) : (
                /* Connect Form */
                <form onSubmit={handleConnectGmail}>
                  <div
                    style={{
                      background: 'rgba(66, 133, 244, 0.08)',
                      border: '1px solid rgba(66, 133, 244, 0.25)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      marginBottom: '0.85rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <GoogleCalendarIcon size={18} className="mt-0.5" />
                    <p style={{ fontSize: '0.75rem', color: 'var(--tx)', margin: 0, lineHeight: 1.4 }}>
                      Add your actual Google Calendar using your Gmail ID. Court listings, bench
                      numbers, and cause dates will sync to your phone and desktop calendar with
                      automatic reminders.
                    </p>
                  </div>

                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--tx)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Enter Your Gmail / Google Workspace Email:
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg)',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      padding: '0.45rem 0.65rem',
                      marginBottom: '0.75rem',
                      gap: '0.45rem',
                    }}
                  >
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      value={inputGmail}
                      onChange={(e) => setInputGmail(e.target.value)}
                      placeholder="e.g. advocate.sharma@gmail.com"
                      required
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.82rem',
                        color: 'var(--tx)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isEditingGmail && (
                      <button
                        type="button"
                        className="btn btn-g btn-s"
                        onClick={() => setIsEditingGmail(false)}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn btn-p btn-s"
                      disabled={connecting}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <GoogleCalendarIcon size={14} />
                      <span>{connecting ? 'Connecting…' : 'Connect Google Calendar'}</span>
                    </button>
                  </div>

                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--bd)' }}>
                    <button
                      type="button"
                      className="btn btn-o btn-s"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}
                      onClick={() => exportAllEventsToGoogleCalendar()}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export All Court Dates (.ics)</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Upcoming this month */}
          <div className="cd">
            <div className="ch">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock className="w-4 h-4 text-slate-700" />
                <span className="ct2">Upcoming Appearances</span>
              </div>
              <span className="chip pr">{filteredEvents.length} Active</span>
            </div>
            <div className="cb" id="cal-up">
              {upcomingMonthEvents.length > 0 ? (
                <div className="dl2">{upcomingMonthEvents.map(renderDeadlineRow)}</div>
              ) : (
                <div className="em">
                  <p>No upcoming docket events found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Listings Modal */}
      {selectedDayModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setSelectedDayModal(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--cd)',
              border: '1px solid var(--bd)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '540px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              animation: 'fadeIn 0.18s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--bd)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GoogleCalendarIcon size={20} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--tx)' }}>
                    Court Listings for {selectedDayModal.dateString}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--tx2)' }}>
                    {selectedDayModal.events.length} appearance(s) scheduled
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-g btn-s"
                style={{ padding: '0.3rem', borderRadius: '50%' }}
                onClick={() => setSelectedDayModal(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1rem 1.25rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedDayModal.events.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      border: '1px solid var(--bd)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      background: 'var(--bg)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <div>
                        <span
                          className={`chip ${EC[ev.type] || 'gd'}`}
                          style={{ marginBottom: '0.3rem', display: 'inline-block' }}
                        >
                          {ev.type}
                        </span>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: 'var(--tx)',
                          }}
                        >
                          {ev.matterName}
                        </h4>
                      </div>
                      <button
                        type="button"
                        className="btn btn-p btn-s"
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.3rem 0.55rem',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => openEventInGoogleCalendar(ev)}
                        title={`Add to Google Calendar (${googleCalendarEmail || 'Gmail'})`}
                      >
                        <GoogleCalendarIcon size={13} />
                        <span>Add to Cal</span>
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '0.4rem',
                        fontSize: '0.75rem',
                        color: 'var(--tx2)',
                        marginTop: '0.5rem',
                      }}
                    >
                      <div>
                        <strong>Venue:</strong> {ev.venue || 'Courtroom'}
                      </div>
                      <div>
                        <strong>Time:</strong> {ev.time || '10:30 AM'}
                      </div>
                      <div>
                        <strong>Counsel:</strong> {ev.attorney || 'Self'}
                      </div>
                      <div>
                        <strong>Priority:</strong>{' '}
                        {ev.priority === 'ug'
                          ? 'Urgent'
                          : ev.priority === 'wa'
                          ? 'Warning'
                          : 'Normal'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid var(--bd)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg)',
              }}
            >
              <button
                type="button"
                className="btn btn-o btn-s"
                onClick={() => exportAllEventsToGoogleCalendar(selectedDayModal.events)}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Day (.ics)</span>
              </button>

              <button
                type="button"
                className="btn btn-g btn-s"
                onClick={() => setSelectedDayModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
