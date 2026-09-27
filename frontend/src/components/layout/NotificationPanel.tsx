import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { dDiff, MSS } from '../../utils/helpers';
import { DocketEvent } from '../../types';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const NotificationPanel: React.FC = () => {
  const { isNotifPanelOpen, toggleNotifPanel, deadlines } = useLawyersDiary();
  const navigate = useNavigate();

  if (!isNotifPanelOpen) return null;

  const urgent = deadlines
    .filter((d) => {
      const diff = dDiff(d.date);
      return diff !== null && diff >= 0 && diff <= 3;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dueSoon = deadlines
    .filter((d) => {
      const diff = dDiff(d.date);
      return diff !== null && diff > 3 && diff <= 14;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcoming = deadlines
    .filter((d) => {
      const diff = dDiff(d.date);
      return diff !== null && diff > 14 && diff <= 30;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const renderItem = (d: DocketEvent, typeClass: string) => {
    const dt = new Date(d.date);
    const diff = dDiff(d.date);
    const lbl =
      diff === 0
        ? 'TODAY'
        : diff === 1
        ? 'Tomorrow'
        : diff !== null && diff < 0
        ? 'OVERDUE'
        : `${diff}d left`;
    const tagClass =
      diff !== null && diff <= 3 ? 'du' : diff !== null && diff <= 14 ? 'dw' : 'dok';

    return (
      <div
        key={d.id}
        className={`np-item ${typeClass}`}
        onClick={() => {
          toggleNotifPanel();
          navigate('/dkt');
        }}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ textAlign: 'center', minWidth: '40px' }}>
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '1.3rem',
              fontWeight: 700,
              color: 'var(--pr)',
              lineHeight: 1,
            }}
          >
            {dt.getDate()}
          </div>
          <div
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--tx2)',
            }}
          >
            {MSS[dt.getMonth()]}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tx)' }}>
            {d.type}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--tx2)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              marginTop: '1px',
            }}
          >
            {d.matterName}
          </div>
          {d.venue && (
            <div style={{ fontSize: '0.7rem', color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{d.venue}</span>
            </div>
          )}
        </div>
        <span
          className={`ddys ${tagClass}`}
          style={{ alignSelf: 'center', flexShrink: 0 }}
        >
          {lbl}
        </span>
      </div>
    );
  };

  const hasEvents = urgent.length > 0 || dueSoon.length > 0 || upcoming.length > 0;

  return (
    <div id="np">
      <div id="np-bg" onClick={toggleNotifPanel} />
      <div id="np-panel">
        <div id="np-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell className="w-4 h-4 text-amber-300" />
            <span
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '1.25rem',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              Upcoming Hearings &amp; Alerts
            </span>
          </div>
          <button
            onClick={toggleNotifPanel}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.8)',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div id="np-body">
          {urgent.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--st-danger-tx)',
                  marginBottom: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Urgent Action Required ({urgent.length})</span>
              </div>
              {urgent.map((d) => renderItem(d, 'ug'))}
            </div>
          )}

          {dueSoon.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--st-warning-tx)',
                  marginTop: '0.9rem',
                  marginBottom: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Due in 14 Days ({dueSoon.length})</span>
              </div>
              {dueSoon.map((d) => renderItem(d, 'wa'))}
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--st-success-tx)',
                  marginTop: '0.9rem',
                  marginBottom: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Scheduled Next 30 Days ({upcoming.length})</span>
              </div>
              {upcoming.map((d) => renderItem(d, 'ok'))}
            </div>
          )}

          {!hasEvents && (
            <div className="em">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p style={{ fontWeight: 600, color: 'var(--tx)' }}>All Dockets Clear</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--tx2)' }}>No court hearings or limitation deadlines in the next 30 days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
