import { sequence } from '@sveltejs/kit/hooks';
import { SvelteKitAuth } from "@auth/sveltekit";
import Credentials from "@auth/core/providers/credentials";
import { getSession, refreshAccessToken, type CognitoUserSessionType } from "$lib/domains/auth/services/Cognito";
import type AuthUser from "$lib/domains/auth/types/AuthUser";
import { AUTH_SECRET } from "$env/static/private";
import type { Handle } from '@sveltejs/kit';

interface AuthToken {
  accessToken: string;
  accessTokenExpires: number;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    image?: string;
  };
}

const extractUserFromSession = (session: CognitoUserSessionType): AuthUser => {
  if (!session?.isValid?.()) throw new Error('Invalid session');
  const user = session.getIdToken().payload;
  return {
    id: user.sub,
    // Extract the username
    username: user.username,
    email: user.email,
    image: user.picture,
    accessToken: session.getAccessToken().getJwtToken(),
    accessTokenExpires: session.getAccessToken().getExpiration() * 1000, // Convert to milliseconds
    refreshToken: session.getRefreshToken().getToken(),
  };
};

const createTokenFromUser = (user: AuthUser): AuthToken => {
  return {
    accessToken: user.accessToken,
    accessTokenExpires: user.accessTokenExpires,
    refreshToken: user.refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
  };
};

export const { handle } = SvelteKitAuth({
  secret: AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      id: "credentials",
      name: "Cognito",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const session = await getSession(credentials.email, credentials.password);
          return extractUserFromSession(session);
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    }) as any
  ],
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/sign-up",
    verifyRequest: "/auth/verify",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return createTokenFromUser(user as AuthUser);
      }
      if (token?.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }
      try {
        const newSession = await refreshAccessToken({
          refreshToken: token?.refreshToken,
        });
        const refreshedUser = extractUserFromSession(newSession);
        return createTokenFromUser(refreshedUser);
      } catch (error) {
        console.error('Token refresh error:', error);
        return {
          ...token,
          error: "RefreshTokenError",
        };
      }
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    }
  },
  debug: process.env.NODE_ENV === 'development',
});