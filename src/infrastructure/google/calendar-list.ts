import { google } from 'googleapis';

export type GoogleCalendarListItem = {
  id?: string | null;
  summary?: string | null;
  primary?: boolean | null;
};

export async function fetchCalendarList(params: {
  refreshToken: string;
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
  const items: GoogleCalendarListItem[] = [];
  let pageToken: string | undefined;

  do {
    const response = await calendar.calendarList.list({
      maxResults: 250,
      pageToken
    });
    items.push(...(response.data?.items || []));
    pageToken = response.data?.nextPageToken || undefined;
  } while (pageToken);

  return items;
}
