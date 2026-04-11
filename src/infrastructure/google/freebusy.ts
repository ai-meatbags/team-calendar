import { google } from 'googleapis';
import {
  normalizeGoogleApiError,
  normalizeGoogleCalendarEntryErrors
} from '@/infrastructure/auth/google-auth-errors';

export async function fetchBusyIntervals(params: {
  refreshToken: string;
  calendarIds: string[];
  timeMin: Date;
  timeMax: Date;
  timeZone: string;
  clientId?: string;
  clientSecret?: string;
}) {
  const oauth2Client = new google.auth.OAuth2(
    params.clientId,
    params.clientSecret,
    process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : undefined
  );

  oauth2Client.setCredentials({ refresh_token: params.refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  let response;
  try {
    response = await calendar.freebusy.query({
      requestBody: {
        timeMin: params.timeMin.toISOString(),
        timeMax: params.timeMax.toISOString(),
        timeZone: params.timeZone,
        items: params.calendarIds.map((id) => ({ id }))
      }
    });
  } catch (error) {
    throw normalizeGoogleApiError(error);
  }

  const calendars = response.data.calendars || {};
  const busy: Array<{ start: string; end: string }> = [];

  for (const calendarId of params.calendarIds) {
    const calendarInfo = calendars[calendarId];
    if (!calendarInfo) {
      continue;
    }
    if (Array.isArray(calendarInfo.errors) && calendarInfo.errors.length) {
      throw normalizeGoogleCalendarEntryErrors(calendarInfo.errors);
    }
    for (const interval of calendarInfo.busy || []) {
      if (interval?.start && interval?.end) {
        busy.push({ start: interval.start, end: interval.end });
      }
    }
  }

  return busy;
}
