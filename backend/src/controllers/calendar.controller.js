const crypto = require('node:crypto');
const { User, Matter, Hearing, Deadline, Organization } = require('../models');
const { ok, fail } = require('../utils');

function escapeIcs(str = '') {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function formatDateIcs(dateObj, timeStr) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = dateObj.getFullYear();
  const m = pad(dateObj.getMonth() + 1);
  const d = pad(dateObj.getDate());

  if (timeStr && timeStr.trim()) {
    let hours = 10;
    let minutes = 30;
    const cleanTime = timeStr.trim().toLowerCase();
    const isPm = cleanTime.includes('pm');
    const isAm = cleanTime.includes('am');
    const match = cleanTime.replace(/[^\d:]/g, '').split(':');

    if (match.length >= 1) {
      hours = parseInt(match[0], 10) || 10;
      if (match.length >= 2) minutes = parseInt(match[1], 10) || 0;
      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;
    }

    const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hours, minutes, 0);
    const end = new Date(start.getTime() + 90 * 60 * 1000);

    const sUtc = `${start.getUTCFullYear()}${pad(start.getUTCMonth() + 1)}${pad(start.getUTCDate())}T${pad(start.getUTCHours())}${pad(start.getUTCMinutes())}00Z`;
    const eUtc = `${end.getUTCFullYear()}${pad(end.getUTCMonth() + 1)}${pad(end.getUTCDate())}T${pad(end.getUTCHours())}${pad(end.getUTCMinutes())}00Z`;

    return { dtStart: `DTSTART:${sUtc}`, dtEnd: `DTEND:${eUtc}` };
  }

  // All day event
  const nextDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1);
  return {
    dtStart: `DTSTART;VALUE=DATE:${y}${m}${d}`,
    dtEnd: `DTEND;VALUE=DATE:${nextDay.getFullYear()}${pad(nextDay.getMonth() + 1)}${pad(nextDay.getDate())}`,
  };
}

async function getFeed(req, res, next) {
  try {
    const { token } = req.params;
    if (!token) throw fail('Feed token is required', 400, 'INVALID_TOKEN');

    const cleanToken = token.replace(/\.ics$/i, '');
    const user = await User.findOne({ calendarToken: cleanToken, isActive: true });
    if (!user) throw fail('Calendar feed not found or expired', 404, 'FEED_NOT_FOUND');

    const org = await Organization.findById(user.organizationId);
    const orgName = org?.name || 'Lawyers Diary';

    // Fetch hearings and matters with upcoming dates
    const [hearings, matters, deadlines] = await Promise.all([
      Hearing.find({ organizationId: user.organizationId }).sort({ hearingDate: 1 }).limit(100),
      Matter.find({ organizationId: user.organizationId, nextDate: { $exists: true, $ne: null } }).limit(100),
      Deadline.find({ organizationId: user.organizationId }).limit(100),
    ]);

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const nowUtc = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lawyers Diary//Court Docketing System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeIcs(`${orgName} — Court Listings`)}`,
      'X-WR-TIMEZONE:Asia/Kolkata',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
      'X-PUBLISHED-TTL:PT1H',
    ];

    // Add hearings
    for (const h of hearings) {
      if (!h.hearingDate) continue;
      const { dtStart, dtEnd } = formatDateIcs(new Date(h.hearingDate), h.hearingTime);
      const uid = `h_${h._id}@lawyersdiary.legal`;
      const summary = `⚖️ [Hearing] ${h.title || 'Court Appearance'}`;
      const desc = `Court: ${h.court || 'Court of Law'}\\nJudge/Bench: ${h.judge || 'Designated Bench'}\\nNotes: ${h.notes || 'None'}`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowUtc}`,
        dtStart,
        dtEnd,
        `SUMMARY:${escapeIcs(summary)}`,
        `DESCRIPTION:${escapeIcs(desc)}`,
        `LOCATION:${escapeIcs(h.location || h.court || 'Court of Law')}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-PT24H',
        `DESCRIPTION:${escapeIcs(`Reminder: Court Hearing Tomorrow: ${h.title || 'Hearing'}`)}`,
        'END:VALARM',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-PT1H',
        `DESCRIPTION:${escapeIcs(`Urgent: Court Hearing in 1 Hour: ${h.title || 'Hearing'}`)}`,
        'END:VALARM',
        'END:VEVENT'
      );
    }

    // Add matters with next court date
    for (const m of matters) {
      if (!m.nextDate) continue;
      const { dtStart, dtEnd } = formatDateIcs(new Date(m.nextDate), '');
      const uid = `m_${m._id}@lawyersdiary.legal`;
      const summary = `🏛️ [Court Date] ${m.caseNo || m.appNo || 'Case'}: ${m.caseTitle || m.mark || 'Matter'}`;
      const desc = `Client: ${m.clientName || 'Client'}\\nCourt: ${m.court || 'Jurisdiction'}\\nStage: ${m.stage || 'Hearing'}\\nCounsel: ${m.attorney || 'Assigned Counsel'}`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowUtc}`,
        dtStart,
        dtEnd,
        `SUMMARY:${escapeIcs(summary)}`,
        `DESCRIPTION:${escapeIcs(desc)}`,
        `LOCATION:${escapeIcs(m.court || 'Court of Law')}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-PT24H',
        `DESCRIPTION:${escapeIcs(`Reminder: Next Court Date Tomorrow for ${m.caseTitle || m.mark}`)}`,
        'END:VALARM',
        'END:VEVENT'
      );
    }

    // Add deadlines
    for (const d of deadlines) {
      if (!d.dueDate) continue;
      const { dtStart, dtEnd } = formatDateIcs(new Date(d.dueDate), '');
      const uid = `d_${d._id}@lawyersdiary.legal`;
      const summary = `⏰ [Statutory Due] ${d.title || 'Filing Deadline'}`;
      const desc = `Priority: ${d.priority || 'Normal'}\\nNotes: ${d.notes || 'Limitation Deadline'}`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowUtc}`,
        dtStart,
        dtEnd,
        `SUMMARY:${escapeIcs(summary)}`,
        `DESCRIPTION:${escapeIcs(desc)}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-PT24H',
        `DESCRIPTION:${escapeIcs(`Limitation / Filing Due Tomorrow: ${d.title}`)}`,
        'END:VALARM',
        'END:VEVENT'
      );
    }

    lines.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="court_docket_${cleanToken.slice(0, 8)}.ics"`);
    res.send(lines.join('\r\n'));
  } catch (error) {
    next(error);
  }
}

async function getSettings(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw fail('User not found', 404);

    let token = user.calendarToken;
    if (!token) {
      token = crypto.randomBytes(16).toString('hex');
      user.calendarToken = token;
      await user.save();
    }

    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const feedUrl = `${protocol}://${host}/api/v1/calendar/feed/${token}.ics`;

    ok(res, {
      googleCalendarEmail: user.googleCalendarEmail || '',
      googleCalendarSync: Boolean(user.googleCalendarSync),
      calendarToken: token,
      feedUrl,
    }, 'Calendar settings retrieved');
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req, res, next) {
  try {
    const { googleCalendarEmail, googleCalendarSync } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) throw fail('User not found', 404);

    if (googleCalendarEmail !== undefined) {
      user.googleCalendarEmail = String(googleCalendarEmail).trim().toLowerCase();
    }
    if (googleCalendarSync !== undefined) {
      user.googleCalendarSync = Boolean(googleCalendarSync);
    }

    if (!user.calendarToken) {
      user.calendarToken = crypto.randomBytes(16).toString('hex');
    }

    await user.save();

    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const feedUrl = `${protocol}://${host}/api/v1/calendar/feed/${user.calendarToken}.ics`;

    ok(res, {
      googleCalendarEmail: user.googleCalendarEmail,
      googleCalendarSync: user.googleCalendarSync,
      calendarToken: user.calendarToken,
      feedUrl,
    }, 'Google Calendar settings updated successfully');
  } catch (error) {
    next(error);
  }
}

async function rotateToken(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw fail('User not found', 404);

    user.calendarToken = crypto.randomBytes(16).toString('hex');
    await user.save();

    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const feedUrl = `${protocol}://${host}/api/v1/calendar/feed/${user.calendarToken}.ics`;

    ok(res, {
      calendarToken: user.calendarToken,
      feedUrl,
    }, 'Calendar token regenerated');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFeed,
  getSettings,
  updateSettings,
  rotateToken,
};
