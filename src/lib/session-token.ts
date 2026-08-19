import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "session";
const SESSION_DAYS = 30;

export type SessionPayload = {
  userId: string;
  storeId: string;
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecretKey());
}

export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string" || typeof payload.storeId !== "string") return null;
    return { userId: payload.userId, storeId: payload.storeId };
  } catch {
    return null;
  }
}
