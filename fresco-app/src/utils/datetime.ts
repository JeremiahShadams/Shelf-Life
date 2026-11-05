/**
 * Fresco — Date helpers
 * FastAPI/SQLAlchemy serialize naive UTC datetimes without a zone suffix
 * (e.g. "2026-11-08T10:58:19.349057"). `new Date()` would read that as local
 * time, shifting every displayed expiry/alert by the device offset.
 */

export function parseServerDate(value: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}
