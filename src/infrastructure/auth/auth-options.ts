import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { schema } from '@/infrastructure/db/schema';
import { createEncryptedDrizzleAdapter } from './encrypted-drizzle-adapter';
import { getServerRuntime } from '@/composition/server-runtime';

type AuthKit = ReturnType<typeof NextAuth>;

const authSchema = {
  usersTable: schema.users,
  accountsTable: schema.accounts,
  sessionsTable: schema.sessions,
  verificationTokensTable: schema.verificationTokens,
  userSlotRuleSettings: schema.userSlotRuleSettings
};

let cachedAuthKit: AuthKit | null = null;

function createAuthConfig(): NextAuthConfig {
  const runtime = getServerRuntime();

  return {
    adapter: createEncryptedDrizzleAdapter(runtime.dbClient.db, authSchema, runtime.tokenVault),
    trustHost: true,
    session: {
      strategy: 'database'
    },
    providers: [
      Google({
        clientId: runtime.env.GOOGLE_CLIENT_ID || '',
        clientSecret: runtime.env.GOOGLE_CLIENT_SECRET || '',
        authorization: {
          params: {
            scope: [
              'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
              'https://www.googleapis.com/auth/calendar.freebusy',
              'openid',
              'email',
              'profile'
            ].join(' '),
            access_type: 'offline'
          }
        }
      })
    ],
    callbacks: {
      async session({ session, user }) {
        if (session.user) {
          (session.user as any).id = user.id;
        }
        return session;
      }
    }
  };
}

function getAuthKit(): AuthKit {
  if (!cachedAuthKit) {
    cachedAuthKit = NextAuth(createAuthConfig());
  }

  return cachedAuthKit;
}

export async function auth(...args: any[]) {
  return (getAuthKit().auth as any)(...args);
}

export async function signIn(...args: any[]) {
  return (getAuthKit().signIn as any)(...args);
}

export async function signOut(...args: any[]) {
  return (getAuthKit().signOut as any)(...args);
}

export async function handleAuthGet(...args: any[]) {
  return (getAuthKit().handlers.GET as any)(...args);
}

export async function handleAuthPost(...args: any[]) {
  return (getAuthKit().handlers.POST as any)(...args);
}
