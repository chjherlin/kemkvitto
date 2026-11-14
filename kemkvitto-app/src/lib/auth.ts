import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createServiceClient } from "./supabase";
import { loadWasherBilling } from "./billing";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = createServiceClient();
        const { data: washer, error } = await supabase
          .from("washers")
          .select("id, email, password_hash, business_name")
          .eq("email", credentials.email)
          .single();

        if (error || !washer) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          washer.password_hash
        );
        if (!valid) return null;

        const billing = await loadWasherBilling(washer.id);
        return {
          id: washer.id,
          email: washer.email,
          name: washer.business_name,
          subscriptionStatus: billing.ok ? billing.washer.subscription_status : null,
          currentPeriodEnd: billing.ok ? billing.washer.current_period_end : null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.subscriptionStatus = user.subscriptionStatus ?? null;
        token.currentPeriodEnd = user.currentPeriodEnd ?? null;
        token.subscriptionCheckedAt = Date.now();
      }
      if (trigger === "update" && session) {
        const update = session as {
          subscriptionStatus?: string | null;
          currentPeriodEnd?: string | null;
        };
        if ("subscriptionStatus" in update) token.subscriptionStatus = update.subscriptionStatus ?? null;
        if ("currentPeriodEnd" in update) token.currentPeriodEnd = update.currentPeriodEnd ?? null;
        token.subscriptionCheckedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      session.subscriptionStatus = token.subscriptionStatus ?? null;
      session.currentPeriodEnd = token.currentPeriodEnd ?? null;
      session.subscriptionCheckedAt = token.subscriptionCheckedAt;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
