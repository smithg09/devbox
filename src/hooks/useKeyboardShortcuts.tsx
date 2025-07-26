import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    // { key: "1", ctrlKey: true, action: () => navigate('/path') },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return;
      }

      const shortcut = shortcuts.find(
        s =>
          s.key.toLowerCase() === event.key.toLowerCase() &&
          Boolean(s.ctrlKey) === event.ctrlKey &&
          Boolean(s.shiftKey) === event.shiftKey &&
          Boolean(s.altKey) === event.altKey
      );

      if (shortcut) {
        /**
         * Define shortcut as per the saved order
         */
        // event.preventDefault();
        // shortcut.action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return shortcuts;
};
