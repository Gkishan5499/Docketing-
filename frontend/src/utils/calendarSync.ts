import { DocketEvent } from '../types';

/**
 * Formats a local date and optional time string (e.g. "10:30" or "10:30 AM")
 * into Google Calendar UTC format (YYYYMMDDTHHmmssZ/YYYYMMDDTHHmmssZ)
 * or all-day format (YYYYMMDD/YYYYMMDD).
 */
export function formatGoogleCalendarDates(dateStr: string, timeStr?: string): string {
  if (!dateStr) return '';
  const [yStr, mStr, dStr] = dateStr.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10) - 1;
  const day = parseInt(dStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return '';

  if (timeStr && timeStr.trim()) {
    // Parse time: handle "10:30", "10:30 AM", "2:45 PM", etc.
    let hours = 10;
    let minutes = 30;
    const cleanTime = timeStr.trim().toLowerCase();
    const isPm = cleanTime.includes('pm');
    const isAm = cleanTime.includes('am');
    const match = cleanTime.replace(/[^\d:]/g, '').split(':');

    if (match.length >= 1) {
      hours = parseInt(match[0], 10) || 10;
      if (match.length >= 2) {
        minutes = parseInt(match[1], 10) || 0;
      }
      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;
    }

    const start = new Date(year, month, day, hours, minutes, 0);
    // Standard court listing duration: 90 minutes
    const end = new Date(start.getTime() + 90 * 60 * 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const toUtcString = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
        d.getUTCHours()
      )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    return `${toUtcString(start)}/${toUtcString(end)}`;
  }

  // All-day event: start day to next day in YYYYMMDD
  const pad = (n: number) => String(n).padStart(2, '0');
  const startStr = `${year}${pad(month + 1)}${pad(day)}`;
  const nextDay = new Date(year, month, day + 1);
  const endStr = `${nextDay.getFullYear()}${pad(nextDay.getMonth() + 1)}${pad(nextDay.getDate())}`;

  return `${startStr}/${endStr}`;
}

/**
 * Builds a direct Google Calendar event creation URL pre-populated with court hearing details,
 * venue, courtroom, and lawyer's Gmail address.
 */
export function buildGoogleCalendarUrl(
  event: DocketEvent,
  options?: {
    lawyerGmail?: string;
    firmName?: string;
  }
): string {
  const dates = formatGoogleCalendarDates(event.date, event.time);
  const title = `⚖️ [Court] ${event.type}: ${event.matterName}`;

  const detailsLines = [
    `🏛️ LAWYERS DIARY — COURT LISTING & DOCKET`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `• Matter / Case: ${event.matterName}`,
    `• Docket Event: ${event.type}`,
    `• Scheduled Date: ${event.date}${event.time ? ` at ${event.time}` : ' (Full Day Listing)'}`,
    `• Court Venue / Bench: ${event.venue || 'Designated Courtroom / Chamber'}`,
    `• Assigned Counsel: ${event.attorney || 'Lead Counsel'}`,
    `• Priority: ${event.priority === 'ug' ? 'URGENT' : event.priority === 'wa' ? 'High Attention' : 'Standard'}`,
    event.notes ? `• Notes & Instructions:\n  ${event.notes}` : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Synced automatically from Lawyers Diary Chambers System`,
    options?.firmName ? `Firm: ${options.firmName}` : '',
  ].filter(Boolean);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: detailsLines.join('\n'),
    location: event.venue || 'Courtroom / Chamber',
  });

  // If a lawyer has connected their Gmail ID, add them as guest/assignee
  if (options?.lawyerGmail && options.lawyerGmail.includes('@')) {
    params.set('add', options.lawyerGmail.trim());
  }

  // Add timezone parameter for accurate placement
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    params.set('ctz', tz);
  } catch {
    params.set('ctz', 'Asia/Kolkata');
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Opens Google Calendar directly in a new tab for a single court appearance.
 */
export function openGoogleCalendarEvent(
  event: DocketEvent,
  options?: { lawyerGmail?: string; firmName?: string }
): void {
  const url = buildGoogleCalendarUrl(event, options);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Generates an RFC 5545 standard .ics file content containing all court listings and deadlines,
 * configured with alarms (24 hours and 1 hour before).
 */
export function generateIcsContent(
  events: DocketEvent[],
  calendarName = 'Lawyers Diary — Court Docket'
): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const nowUtc = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const escapeIcs = (str = '') =>
    str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lawyers Diary//Court Docketing System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];

  for (const event of events) {
    if (!event.date) continue;
    const [yStr, mStr, dStr] = event.date.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10) - 1;
    const day = parseInt(dStr, 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) continue;

    const uid = `ld_${event.id || Math.random().toString(36).slice(2)}@lawyersdiary.legal`;
    let dtStart = '';
    let dtEnd = '';

    if (event.time && event.time.trim()) {
      let hours = 10;
      let minutes = 30;
      const cleanTime = event.time.trim().toLowerCase();
      const isPm = cleanTime.includes('pm');
      const isAm = cleanTime.includes('am');
      const match = cleanTime.replace(/[^\d:]/g, '').split(':');

      if (match.length >= 1) {
        hours = parseInt(match[0], 10) || 10;
        if (match.length >= 2) minutes = parseInt(match[1], 10) || 0;
        if (isPm && hours < 12) hours += 12;
        if (isAm && hours === 12) hours = 0;
      }

      const s = new Date(year, month, day, hours, minutes, 0);
      const e = new Date(s.getTime() + 90 * 60 * 1000);

      dtStart = `DTSTART:${s.getUTCFullYear()}${pad(s.getUTCMonth() + 1)}${pad(s.getUTCDate())}T${pad(
        s.getUTCHours()
      )}${pad(s.getUTCMinutes())}00Z`;
      dtEnd = `DTEND:${e.getUTCFullYear()}${pad(e.getUTCMonth() + 1)}${pad(e.getUTCDate())}T${pad(
        e.getUTCHours()
      )}${pad(e.getUTCMinutes())}00Z`;
    } else {
      // Full day event
      const nextDay = new Date(year, month, day + 1);
      dtStart = `DTSTART;VALUE=DATE:${year}${pad(month + 1)}${pad(day)}`;
      dtEnd = `DTEND;VALUE=DATE:${nextDay.getFullYear()}${pad(nextDay.getMonth() + 1)}${pad(
        nextDay.getDate()
      )}`;
    }

    const description = `Matter: ${event.matterName}\\nType: ${event.type}\\nCounsel: ${
      event.attorney || 'Self'
    }\\nVenue: ${event.venue || 'Courtroom'}${event.notes ? `\\nNotes: ${event.notes}` : ''}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowUtc}`,
      dtStart,
      dtEnd,
      `SUMMARY:${escapeIcs(`⚖️ [${event.type}] ${event.matterName}`)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `LOCATION:${escapeIcs(event.venue || 'Court of Law')}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      // Pop-up Alarm 24 hours before
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-PT24H',
      `DESCRIPTION:${escapeIcs(`Reminder: Court Listing Tomorrow for ${event.matterName}`)}`,
      'END:VALARM',
      // Pop-up Alarm 1 hour before
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-PT1H',
      `DESCRIPTION:${escapeIcs(`Urgent: Court Appearance in 1 Hour: ${event.matterName}`)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a browser download of an .ics file that can be dragged into Google Calendar
 * or imported into any Google Workspace / Android / Apple Calendar.
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Builds Google Calendar web subscription URL using the iCal/Webcal feed.
 */
export function buildGoogleCalendarSubscribeUrl(feedUrl: string): string {
  // Google Calendar URL scheme to subscribe to a public or tokenized iCal feed
  const cleanUrl = feedUrl.replace(/^https?:\/\//i, 'webcal://');
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(cleanUrl)}`;
}
