import NextAuth, { type NextAuthConfig } from 'next-auth';
import { and, eq } from 'drizzle-orm';
import Google from 'next-auth/providers/google';
import { schema } from '@/infrastructure/db/schema';
import { createEncryptedDrizzleAdapter } from './encrypted-drizzle-adapter';
import { getServerRuntime } from '@/composition/server-runtime';
import { resolveGoogleAccountState } from './google-account-state';

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
    },
    events: {
      async signIn({ user, account }) {
        if (!account || account.provider !== 'google' || !user?.id) {
          return;
        }

        const existingAccounts = await runtime.dbClient.db
          .select()
          .from(schema.accounts)
          .where(
            and(
              eq(schema.accounts.provider, account.provider),
              eq(schema.accounts.providerAccountId, account.providerAccountId)
            )
          )
          .limit(1);

        const existingAccount = existingAccounts[0] || null;
        const timestamp = new Date().toISOString();
        const { encryptedRefreshToken, authStatus, authStatusReason } = resolveGoogleAccountState({
          account,
          storedRefreshToken: existingAccount?.refreshToken || null,
          tokenVault: runtime.tokenVault
        });

        await runtime.dbClient.db
          .update(schema.accounts)
          .set({
            refreshToken: encryptedRefreshToken,
            authStatus,
            authStatusUpdatedAt: timestamp,
            authStatusReason
          })
          .where(
            and(
              eq(schema.accounts.provider, account.provider),
              eq(schema.accounts.providerAccountId, account.providerAccountId)
            )
          );
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
