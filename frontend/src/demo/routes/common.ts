import type { Page } from '@/lib/api/types';
import { invalid } from '../router';

/** A whole number from the query string, checked like the backend's DTOs. */
export function queryInt(
  query: Record<string, string>,
  key: string,
  min: number,
  max: number,
  fallback: number,
): number {
  const raw = query[key];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) throw invalid(`${key} must be from ${min} to ${max}`);
  return value;
}

export function queryBool(query: Record<string, string>, key: string): boolean {
  const raw = query[key];
  if (raw === undefined || raw === 'false') return false;
  if (raw === 'true') return true;
  throw invalid(`${key} must be true or false`);
}

/** limit (1-50, default 20) and offset (default 0), the backend's pagination. */
export function paginate<T>(items: readonly T[], query: Record<string, string>): Page<T> {
  const limit = queryInt(query, 'limit', 1, 50, 20);
  const offset = queryInt(query, 'offset', 0, Number.MAX_SAFE_INTEGER, 0);
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset };
}

export function bodyOf(body: unknown): Record<string, unknown> {
  return typeof body === 'object' && body !== null && !(body instanceof FormData)
    ? (body as Record<string, unknown>)
    : {};
}
