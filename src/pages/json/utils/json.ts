export function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export function minifyJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function getLineColumnForIndex(text: string, index: number) {
  const slice = text.slice(0, Math.max(0, index));
  const lines = slice.split(/\n/);
  const line = lines.length; // 1-based
  const column = lines[lines.length - 1].length + 1; // 1-based
  return { line, column };
}

export function safeParse(
  jsonString: string
): { ok: true; value: unknown } | { ok: false; message: string; line?: number; column?: number } {
  try {
    const val = JSON.parse(jsonString);
    return { ok: true, value: val };
  } catch (err) {
    const message = (err as Error).message || "Invalid JSON";
    const match = message.match(/position\s+(\d+)/i);
    if (match) {
      const pos = parseInt(match[1], 10);
      const { line, column } = getLineColumnForIndex(jsonString, pos);
      return { ok: false, message, line, column };
    }
    return { ok: false, message };
  }
}
