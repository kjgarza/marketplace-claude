# Google Auth Patterns — Auth.js v5 (next-auth)

Install:

```bash
bun add next-auth
```

Required env vars in `.env.local`:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=        # generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

---

## `packages/ui/auth.ts`

NextAuth config with GoogleProvider and domain allowlist:

```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_DOMAINS = [
  "yourcompany.com",
  "contractor.io",
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email ?? "";
      const domain = email.split("@")[1];
      if (!ALLOWED_DOMAINS.includes(domain)) {
        return false; // Block sign-in
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

---

## `packages/ui/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

---

## `packages/ui/middleware.ts`

Protect all routes except `/login` and NextAuth API routes:

```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## `packages/ui/providers/auth-provider.tsx`

```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Wrap `app/layout.tsx` body:

```typescript
// app/layout.tsx
import { AuthProvider } from "@/providers/auth-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* sidebar + main */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## `packages/ui/app/(public)/login/page.tsx`

```typescript
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button type="submit" className="w-full">
              Continue with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## User Sync to API

If you need to sync the authenticated user to the backend on first sign-in, add to the `signIn` callback:

```typescript
async signIn({ user, account }) {
  const email = user.email ?? "";
  const domain = email.split("@")[1];
  if (!ALLOWED_DOMAINS.includes(domain)) return false;

  // Sync user to backend
  await fetch("http://localhost:3001/api/users/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      name: user.name,
      image: user.image,
      provider: account?.provider,
    }),
  }).catch(() => {}); // Non-fatal — don't block sign-in if API is down

  return true;
},
```

---

## Accessing the Session

In **Server Components**:

```typescript
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  // session.user.email, session.user.name, session.user.image
}
```

In **Client Components**:

```typescript
"use client";
import { useSession } from "next-auth/react";

export function UserAvatar() {
  const { data: session } = useSession();
  return <span>{session?.user?.name}</span>;
}
```

---

## Gotchas

- `NEXTAUTH_URL` must match the exact origin in production — do not include a trailing slash.
- The `(public)` route group in `app/(public)/login/` is a Next.js route group (no URL segment) — it just organises files outside of middleware protection.
- If running behind a reverse proxy, set `NEXTAUTH_URL` to the public URL, not `localhost`.
- `NEXTAUTH_SECRET` must be set in production — Auth.js v5 will error without it.
