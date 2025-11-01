import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { User, Membership } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      memberships: Array<{
        id: string;
        orgId: string;
        role: string;
      }>;
      currentOrgId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    memberships: Array<Membership>;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: { email: string; password: string }) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            memberships: {
              select: {
                id: true,
                orgId: true,
                role: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          memberships: user.memberships,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign-in: populate token with user data
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.memberships = user.memberships;
      }
      
      // On every request, refresh memberships from database
      // This ensures the session always has the latest membership data
      // Important for onboarding flow where org is created during session
      if (token.id) {
        const userWithMemberships = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            memberships: {
              select: {
                id: true,
                orgId: true,
                role: true,
              },
            },
          },
        });
        
        if (userWithMemberships) {
          token.memberships = userWithMemberships.memberships;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.memberships = (token.memberships as Array<{
          id: string;
          orgId: string;
          role: string;
        }>) || [];
        session.user.currentOrgId = token.currentOrgId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

