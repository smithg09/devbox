export const SIDEBAR_CONSTANTS = {
  ICON_SIZE: {
    SMALL: 15,
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

// Keyboard shortcuts - use platform-agnostic MOD (⌘ on macOS, Ctrl on others)
import { MOD_EVENT_PROP } from "@/utils/keyboard";

export const KEYBOARD_SHORTCUTS = {
  MOD_PROP: MOD_EVENT_PROP,
  TOGGLE_KEY: "b",
  SEARCH_KEY: "k",
} as const;
