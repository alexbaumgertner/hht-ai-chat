import type { NextAuthConfig } from 'next-auth'
import Facebook from 'next-auth/providers/facebook'

/**
 * Auth.js configuration for social login.
 *
 * Credentials are read from AUTH_FACEBOOK_ID/AUTH_FACEBOOK_SECRET by Auth.js convention.
 *
 * The provider requests the `email` scope and exposes a profile picture,
 * which Auth.js normalizes onto `user.email` and `user.image`.
 */
export const authConfig: NextAuthConfig = {
  providers: [Facebook],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    /**
     * The users collection requires a unique email, so a provider account
     * without one cannot be provisioned. Facebook may omit it for accounts
     * created on mobile.
     */
    signIn: ({ user, profile }) => {
      if (user?.email || profile?.email) return true
      return '/login?error=NoEmailFromProvider'
    },
  },
}
