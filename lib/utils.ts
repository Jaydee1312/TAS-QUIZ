import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Định dạng giây thành mm:ss hoặc h:mm:ss */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** Định dạng ngày kiểu Việt Nam */
export function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[parts.length - 1][0] ?? "")).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

/** Tách chuỗi key đáp án ("A" hoặc "A,C") thành mảng key đã chuẩn hoá. */
export function parseAnswerKeys(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

/** So khớp đáp án (đúng khi chọn đúng & đủ tất cả key, không thừa). */
export function answersMatch(
  correct?: string | null,
  user?: string | null
): boolean {
  const c = parseAnswerKeys(correct);
  const u = new Set(parseAnswerKeys(user));
  if (c.length === 0 || c.length !== u.size) return false;
  return c.every((k) => u.has(k));
}
