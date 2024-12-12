import { encrypt, decrypt } from "./crypto.ts";
import { FreshContext } from "$fresh/server.ts";
import { getCookies, setCookie } from "$std/http/cookie.ts";

const SESSION_COOKIE = "session";
const SESSION_KEY = Deno.env.get("SESSION_KEY") || "default-session-key-change-me-in-production";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
const CURRENT_VERSION = "1"; // Increment this when changing session structure

export interface Session {
    salt: string;
    version: string;
    values: string[];
    changed: boolean;
}

/**
 * Creates a new session with a random salt and current version number
 */
export function createSession(): Session {
    // console.log("[Sessions] Creating new session");
    return {
        salt: crypto.randomUUID().slice(0, 10),
        version: CURRENT_VERSION,
        values: [],
        changed: true,
    };
}

/**
 * Encrypts session data into a cookie-safe string
 */
async function encryptSession(session: Session): Promise<string | undefined> {
    // console.log("[Sessions] Encrypting session data");
    const values = [session.salt, session.version, ...session.values];
    return await encrypt(values.join(","), SESSION_KEY);
}

/**
 * Decrypts a session cookie string into a Session object
 */
async function decryptSession(encrypted: string): Promise<Session | undefined> {
    // console.log("[Sessions] Attempting to decrypt session");
    const decrypted = await decrypt(encrypted, SESSION_KEY);
    if (!decrypted) {
        // console.log("[Sessions] Failed to decrypt session");
        return undefined;
    }

    const values = decrypted.split(",");
    if (values.length < 2) {
        // console.log("[Sessions] Invalid session format");
        return undefined;
    }

    const [salt, version, ...rest] = values;
    // console.log("[Sessions] Successfully decrypted session with values:", values);
    return {
        salt,
        version,
        values: rest,
        changed: false,
    };
}

/**
 * Gets the current session from cookies, creating a new one if none exists
 * or if the existing session is invalid
 */
export async function getSession(req: Request): Promise<Session> {
    // console.log("[Sessions] Getting session from request");
    const cookies = getCookies(req.headers);
    const sessionCookie = cookies[SESSION_COOKIE];

    if (!sessionCookie) {
        // console.log("[Sessions] No session cookie found, creating new session");
        return createSession();
    }

    const session = await decryptSession(sessionCookie);
    if (!session) {
        // console.log("[Sessions] Invalid session cookie, creating new session");
        return createSession();
    }

    if (session.version !== CURRENT_VERSION) {
        // console.log("[Sessions] Outdated session version, creating new session");
        return createSession();
    }

    // console.log("[Sessions] Retrieved valid session");
    return session;
}

/**
 * Saves the session to response headers if it has changed
 */
export async function saveSession(response: Response, session: Session): Promise<Response> {
    // console.log("[Sessions] Saving session, changed:", session.changed);
    if (!session.changed) {
        // console.log("[Sessions] Session unchanged, skipping save");
        return response;
    }

    const encrypted = await encryptSession(session);
    if (!encrypted) {
        // console.log("[Sessions] Failed to encrypt session");
        return response;
    }

    // console.log("[Sessions] Setting session cookie");
    const headers = new Headers(response.headers);
    setCookie(headers, {
        name: SESSION_COOKIE,
        value: encrypted,
        maxAge: SESSION_MAX_AGE,
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

export function clearSession(response: Response): Response {
    const headers = new Headers(response.headers);
    setCookie(headers, {
        name: SESSION_COOKIE,
        value: "",
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
    });
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * Middleware that injects session handling into the context
 */
export async function sessionMiddleware(req: Request, ctx: FreshContext) {
    // console.log("[Sessions] Running session middleware");
    const session = await getSession(req);
    ctx.state.session = session;

    const response = await ctx.next();
    return await saveSession(response, session);
}

/**
 * Helper to get typed session values at specific indices
 */
export function getSessionValue(session: Session, index: number): string | undefined {
    // console.log(`[Sessions] Getting value at index ${index}`);
    return session.values[index];
}

/**
 * Helper to set session values at specific indices
 */
export function setSessionValue(session: Session, index: number, value: string) {
    // console.log(`[Sessions] Setting value at index ${index}:`, value);
    // Ensure array is long enough
    while (session.values.length <= index) {
        session.values.push("");
    }
    session.values[index] = value;
    session.changed = true;
}
