import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable in .env.local");
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: "station-admin" | "super-admin";
  iat?: number;
  exp?: number;
}

export function signToken(userId: string, username: string, role: "station-admin" | "super-admin"): string {
  return jwt.sign({ userId, username, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "jwt_token";
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
