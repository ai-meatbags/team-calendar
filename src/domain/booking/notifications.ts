export function deduplicateEmails(values: Array<string | null | undefined>) {
  const normalized = values
    .map((item) => String(item || '').trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(normalized));
}
