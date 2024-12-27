# Implementing Google OAuth Authentication in Deno Fresh

This guide will walk you through implementing Google OAuth authentication in your Deno Fresh project.

## Prerequisites

1. A Google Cloud Console project
2. OAuth 2.0 Client credentials
3. Deno and Fresh installed

## Step 1: Set Up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google OAuth2 API
4. Configure the OAuth consent screen
5. Create OAuth 2.0 Client credentials
   - Set authorized redirect URIs (e.g., `http://localhost:8000/api/auth/callback`)
   - Download the client configuration JSON

## Step 2: Project Configuration

Create a `.env` file in your project root:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/callback
```

## Step 3: Implementation

### 1. Create Auth Types

Create `types/auth.ts`:

```typescript
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface Session {
  user?: GoogleUser;
  accessToken?: string;
  refreshToken?: string;
}
```

### 2. Create Auth Utils

Create `utils/auth.ts`:

```typescript
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.2/mod.ts";

export function createOAuthClient() {
  return new OAuth2Client({
    clientId: Deno.env.get("GOOGLE_CLIENT_ID")!,
    clientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
    authorizationEndpointUri: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUri: "https://oauth2.googleapis.com/token",
    redirectUri: Deno.env.get("GOOGLE_REDIRECT_URI")!,
    defaults: {
      scope: ["https://www.googleapis.com/auth/userinfo.profile", 
              "https://www.googleapis.com/auth/userinfo.email"],
    },
  });
}

export async function getUserInfo(accessToken: string): Promise<GoogleUser> {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }
  return await response.json();
}
```

### 3. Create Auth Routes

Create `routes/api/auth/signin.ts`:

```typescript
import { HandlerContext } from "$fresh/server.ts";
import { createOAuthClient } from "../../../utils/auth.ts";

export async function handler(req: Request, ctx: HandlerContext) {
  const oauth2Client = createOAuthClient();
  const url = await oauth2Client.code.getAuthorizationUri();
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  });
}
```

Create `routes/api/auth/callback.ts`:

```typescript
import { HandlerContext } from "$fresh/server.ts";
import { createOAuthClient, getUserInfo } from "../../../utils/auth.ts";
import { setCookie } from "https://deno.land/std@0.181.0/http/cookie.ts";

export async function handler(req: Request, ctx: HandlerContext) {
  const oauth2Client = createOAuthClient();
  const tokens = await oauth2Client.code.getToken(req.url);
  const userInfo = await getUserInfo(tokens.accessToken);
  
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  });

  // Set session cookie
  setCookie(response.headers, {
    name: "session",
    value: JSON.stringify({
      user: userInfo,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });

  return response;
}
```

### 4. Create Auth Middleware

Create `routes/_middleware.ts`:

```typescript
import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "https://deno.land/std@0.181.0/http/cookie.ts";
import { Session } from "../types/auth.ts";

interface State {
  session?: Session;
}

export async function handler(
  req: Request,
  ctx: FreshContext<State>
) {
  // Only apply middleware to route handlers, not static files or internal requests
  if (ctx.destination !== "route") {
    return await ctx.next();
  }

  const cookies = getCookies(req.headers);
  const sessionCookie = cookies.session;

  if (sessionCookie) {
    try {
      const session: Session = JSON.parse(sessionCookie);
      // Modify state directly instead of replacing the entire object
      ctx.state.session = session;
    } catch {
      // Invalid session cookie
      console.error("Invalid session cookie");
    }
  }

  const resp = await ctx.next();
  return resp;
}
```

For protected routes, create `routes/admin/_middleware.ts`:

```typescript
import { FreshContext } from "$fresh/server.ts";
import { Session } from "../../types/auth.ts";

interface State {
  session?: Session;
}

export async function handler(
  req: Request,
  ctx: FreshContext<State>
) {
  // Check if user is authenticated
  if (!ctx.state.session?.user) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "Location": "/api/auth/signin",
      },
    });
  }

  return await ctx.next();
}
```

### 5. Add Auth UI Components

Create `components/AuthButton.tsx`:

```typescript
import { Session } from "../types/auth.ts";

interface AuthButtonProps {
  session?: Session;
}

export default function AuthButton({ session }: AuthButtonProps) {
  return (
    <div>
      {session?.user ? (
        <div class="flex items-center gap-2">
          <img
            src={session.user.picture}
            alt={session.user.name}
            class="w-8 h-8 rounded-full"
          />
          <span>{session.user.name}</span>
          <a
            href="/api/auth/signout"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Sign Out
          </a>
        </div>
      ) : (
        <a
          href="/api/auth/signin"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Sign in with Google
        </a>
      )}
    </div>
  );
}
```

## Step 4: Usage

Update your navbar component (`components/Navbar.tsx`):

```typescript
import { PageProps } from "$fresh/server.ts";
import AuthButton from "./AuthButton.tsx";
import { Session } from "../types/auth.ts";

interface NavbarProps {
  session?: Session;
}

export default function Navbar({ session }: NavbarProps) {
  return (
    <nav class="w-full px-8 py-4 bg-white border-b flex items-center justify-between">
      <div class="flex items-center gap-6">
        <a href="/" class="text-2xl font-bold">
          Your App
        </a>
        {/* Add your other nav links here */}
      </div>
      <AuthButton session={session} />
    </nav>
  );
}
```

## Security Considerations

1. Always use HTTPS in production
2. Store sensitive data in secure cookies
3. Implement CSRF protection
4. Regularly rotate OAuth client secrets
5. Validate all user input and tokens
6. Implement proper session management

## Error Handling

Add proper error handling for:
- Invalid tokens
- Network failures
- API rate limits
- Invalid/expired sessions

## Testing

1. Create test OAuth credentials
2. Mock OAuth responses
3. Test authentication flow
4. Test session management
5. Test error scenarios

## Deployment

1. Update OAuth redirect URIs for production
2. Set up environment variables
3. Enable HTTPS
4. Configure session storage
5. Set up monitoring
