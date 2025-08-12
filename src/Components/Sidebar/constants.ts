export const SIDEBAR_CONSTANTS = {
  ICON_SIZE: {
    SMALL: 16,
    MEDIUM: 18,
    LARGE: 20,
  },
  SPACING: {
    ITEM_MARGIN_TOP: 6,
  },
  SCROLL_BEHAVIOR: {
    BLOCK: "center" as const,
    BEHAVIOR: "smooth" as const,
  },
} as const;

// Keyboard shortcuts - use CMD on macOS, CTRL on other platforms
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_SIDEBAR: navigator.platform.includes("Mac") ? "metaKey" : "ctrlKey",
  TOGGLE_KEY: "b",
  SEARCH_SHORTCUT: navigator.platform.includes("Mac") ? "metaKey" : "ctrlKey",
  SEARCH_KEY: "k",
} as const;
