// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

// Add interface for session user
interface SessionUser {
  id: string;
  username: string;
  email: string;
  image?: string;
}

interface Session {
  user: SessionUser;
}

const unprotectedRoutes = ['/auth/login', '/auth/sign-up', '/auth/verify'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const session = (await locals.getSession()) as Session | null;

  if (unprotectedRoutes.includes(url.pathname)) {
    return { session };
  }

  if (!session?.user?.id) {
    throw redirect(307, '/auth/login');
  }

  // Log session data to debug
  console.log('Session data:', session);

  return {
    session: {
      ...session,
      user: {
        ...session.user,
        // Ensure username is available
        username: session.user.username || session.user.email?.split('@')[0] || 'user'
      }
    }
  };
};
