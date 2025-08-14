export const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform);

export const MOD_EVENT_PROP: "metaKey" | "ctrlKey" = isMac ? "metaKey" : "ctrlKey";

export const MOD_KEY_LABEL = isMac ? "⌘" : "Ctrl";

export function isModEvent(event: KeyboardEvent): boolean {
  return isMac ? event.metaKey : event.ctrlKey;
}

export function formatShortcut(keys: Array<string | number>): string {
  const tail = keys.map(k => String(k).toUpperCase()).join("+");
  return `${MOD_KEY_LABEL}+${tail}`;
}
export function formatShortcutDisplay(...keys: Array<string | number>): string {
  const tail = keys.map(k => String(k).toUpperCase()).join("+");
  return isMac ? `${MOD_KEY_LABEL}${tail}` : `${MOD_KEY_LABEL}+${tail}`;
}
