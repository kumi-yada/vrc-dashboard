const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

// Compact relative time: "just now", "5m ago", "2h ago", "1d ago", "3w ago", "5mo ago", "1y ago"
export function formatShortAgo(date: Date | string | number): string {
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return "Unknown";

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (seconds < MINUTE) return "just now";
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)}m ago`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h ago`;
  if (seconds < WEEK) return `${Math.floor(seconds / DAY)}d ago`;
  if (seconds < MONTH) return `${Math.floor(seconds / WEEK)}w ago`;
  if (seconds < YEAR) return `${Math.floor(seconds / MONTH)}mo ago`;
  return `${Math.floor(seconds / YEAR)}y ago`;
}
