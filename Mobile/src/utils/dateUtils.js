/**
 * Parse a UTC datetime string from the backend into a local Date object.
 *
 * Backend stores all timestamps as DateTime.UtcNow but the default JSON
 * serializer omits the "Z" suffix — so JavaScript's `new Date(iso)` treats
 * the value as local time, producing wrong hours.
 *
 * This helper appends "Z" if missing so the Date constructor interprets the
 * value as UTC and converts it to the device's local timezone automatically.
 */
export function parseUTC(iso) {
  if (!iso) return new Date();
  const str = String(iso);
  return new Date(str.endsWith('Z') ? str : str + 'Z');
}

/**
 * Format a UTC datetime string from the backend into a readable local
 * date+time string (DD/MM/YYYY HH:mm:ss).
 */
export function formatDate(iso) {
  const d = parseUTC(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}

/**
 * Format a UTC datetime string into a shorter local date+time
 * (MM/DD/YYYY, HH:mm AM/PM).
 */
export function formatDateShort(iso) {
  return parseUTC(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
