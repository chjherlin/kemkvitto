import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    subscriptionStatus?: string | null;
    currentPeriodEnd?: string | null;
  }

  interface Session {
    subscriptionStatus?: string | null;
    currentPeriodEnd?: string | null;
    subscriptionCheckedAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    subscriptionStatus?: string | null;
    currentPeriodEnd?: string | null;
    subscriptionCheckedAt?: number;
  }
}
