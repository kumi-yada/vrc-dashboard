import { t } from "../stores/i18n.svelte";

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

// Compact relative time: "just now", "5m ago", "2h ago", "1d ago", "3w ago", "5mo ago", "1y ago"
export function formatShortAgo(date: Date | string | number): string {
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return t("common.unknown");

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (seconds < MINUTE) return t("time.justNow");
  if (seconds < HOUR) return t("time.minAgo", { n: Math.floor(seconds / MINUTE) });
  if (seconds < DAY) return t("time.hourAgo", { n: Math.floor(seconds / HOUR) });
  if (seconds < WEEK) return t("time.dayAgo", { n: Math.floor(seconds / DAY) });
  if (seconds < MONTH) return t("time.weekAgo", { n: Math.floor(seconds / WEEK) });
  if (seconds < YEAR) return t("time.monthAgo", { n: Math.floor(seconds / MONTH) });
  return t("time.yearAgo", { n: Math.floor(seconds / YEAR) });
}
