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
      if (user.email) {
        try {
          const { sql } = await import('@vercel/postgres');
          await sql`
            INSERT INTO users (email, name, last_login, login_count, neighborhood_finder_calls, true_commute_calls, api_calls)
            VALUES (${user.email}, ${user.name}, NOW(), 1, 0, 0, 0)
            ON CONFLICT (email)
            DO UPDATE SET
              last_login = NOW(),
              name = EXCLUDED.name,
              login_count = users.login_count + 1;
          `;
        } catch (e) {
          console.error("Failed to track user login", e);
        }
      }
      return true;
    },
  },
})
