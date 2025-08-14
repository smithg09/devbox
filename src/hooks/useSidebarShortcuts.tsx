import { KEYBOARD_SHORTCUTS } from "@/components/Sidebar/constants";
import { useWindowEvent } from "@mantine/hooks";
import { useCallback, useRef } from "react";

interface UseSidebarShortcutsProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

export const useSidebarShortcuts = ({ collapsed, setCollapsed }: UseSidebarShortcutsProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs (except for our search)
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      const isToggleShortcut =
        e[KEYBOARD_SHORTCUTS.MOD_PROP] && e.key === KEYBOARD_SHORTCUTS.TOGGLE_KEY;

      const isSearchShortcut =
        e[KEYBOARD_SHORTCUTS.MOD_PROP] && e.key === KEYBOARD_SHORTCUTS.SEARCH_KEY;

      if (isToggleShortcut) {
        e.preventDefault();
        setCollapsed(!collapsed);
      }

      if (isSearchShortcut && !collapsed && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    },
    [collapsed, setCollapsed]
  );

  useWindowEvent("keydown", handleKeydown);

  return { searchInputRef };
};
