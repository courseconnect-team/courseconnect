import * as admin from 'firebase-admin';
import type { Request, Response } from 'express';

// Single-source-of-truth helpers for all Cloud Functions in this codebase.
//
// This module does NOT import from ./index so the Firebase Functions loader
// can walk the module graph without cycling. New Cloud Function files should
// import their helpers from here, not from ./index.

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
db.settings({ ignoreUndefinedProperties: true });

export const ALLOWED_ORIGINS = new Set(
  [
    'https://courseconnect.eng.ufl.edu',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  ].filter(Boolean)
);

export const STAFF_ROLES = new Set(['admin', 'faculty']);

export function setCors(req: Request, res: Response): void {
  const origin = req.get('origin');
  res.set('Vary', 'Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleMethod(req: Request, res: Response): boolean {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return false;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return false;
  }
  return true;
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring('Bearer '.length).trim();
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

export function readString(
  source: Record<string, unknown>,
  key: string
): string | undefined {
  const value = source[key];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export async function verifyAuth(
  req: Request,
  res: Response
): Promise<admin.auth.DecodedIdToken | null> {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ message: 'Missing bearer token' });
    return null;
  }

  try {
    return await auth.verifyIdToken(token);
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Invalid auth token' });
    return null;
  }
}

export async function getRole(uid: string): Promise<string> {
  const snap = await db.collection('users').doc(uid).get();
  const data = snap.data() as Record<string, unknown> | undefined;
  return typeof data?.role === 'string' ? data.role : '';
}

export async function ensureStaffRole(
  uid: string,
  res: Response
): Promise<boolean> {
  const role = await getRole(uid);
  if (!STAFF_ROLES.has(role)) {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
  return true;
}

export function fail(res: Response, message: string, code = 400): void {
  res.status(code).json({ message });
}

// Verify the caller is a super admin. Reads users/{uid}.superAdmin directly —
// the `superAdmin` field is protected from client writes by firestore.rules.
export async function ensureSuperAdmin(
  uid: string,
  res: Response
): Promise<boolean> {
  const snap = await db.collection('users').doc(uid).get();
  const data = snap.data() as Record<string, unknown> | undefined;
  if (data?.superAdmin !== true) {
    res.status(403).json({ message: 'Forbidden — super admin only' });
    return false;
  }
  return true;
}
