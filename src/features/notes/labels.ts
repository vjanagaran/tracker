import { format, parseISO } from "date-fns";

export function displayTitle(title: string) {
  const trimmed = title.trim();
  return trimmed || "Untitled";
}

export function formatUpdated(value: string) {
  return format(parseISO(value), "d MMM yyyy");
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
