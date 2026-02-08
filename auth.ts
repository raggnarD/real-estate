import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  secret: process.env.AUTH_SECRET || "development-secret-at-least-thirty-two-characters-long",
  trustHost: true,
  callbacks: {
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth
    },
    signIn: async ({ user }) => {
      // STRICT ALLOWLIST
      // Google's "Testing" mode can be flaky. We enforce it here.
      const allowedEmails = (process.env.ALLOWED_USERS || "james.kocher@gmail.com")
        .split(',')
        .map(e => e.trim().toLowerCase());

      if (user.email && allowedEmails.includes(user.email.toLowerCase())) {
        return true;
      }

      console.log(`Access Denied for user: ${user.email}`);
      return false; // Reject everyone else
    },
  },
})
