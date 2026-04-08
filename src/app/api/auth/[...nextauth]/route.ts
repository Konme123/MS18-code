import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ADMIN_EMAIL_ALLOWLIST = new Set([
  'ms18@admin888.com',
]);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getJwtExpMs(jwt?: string) {
  if (!jwt) return null;
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as { exp?: number };
    if (!payload?.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;
        if (!ADMIN_EMAIL_ALLOWLIST.has(email)) return null;

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user || !data.session) return null;

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.email,
          supabaseAccessToken: data.session.access_token,
          supabaseRefreshToken: data.session.refresh_token,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.email = (user as any).email;
        token.sub = (user as any).id;
        token.supabaseAccessToken = (user as any).supabaseAccessToken;
        token.supabaseRefreshToken = (user as any).supabaseRefreshToken;
      }

      const accessToken = (token as any).supabaseAccessToken as string | undefined;
      const refreshToken = (token as any).supabaseRefreshToken as string | undefined;
      const expMs = getJwtExpMs(accessToken);

      if (accessToken && refreshToken && expMs) {
        const shouldRefresh = Date.now() > expMs - 60_000;
        if (shouldRefresh) {
          const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
          if (!error && data?.session?.access_token) {
            (token as any).supabaseAccessToken = data.session.access_token;
            (token as any).supabaseRefreshToken = data.session.refresh_token;
          }
        }
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.email = token.email as string;
      }
      (session as any).supabaseAccessToken = (token as any).supabaseAccessToken;
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
