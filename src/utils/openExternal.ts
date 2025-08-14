import { isTauri } from "@/utils/isTauri";

/**
 * Open a URL in the user's default external browser.
 * Works in both Tauri (desktop) and Web builds.
 */
export async function openExternal(url: string): Promise<void> {
  try {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_external", { url });
      return;
    }
  } catch (_err) {
    // fall through to window.open
  }

  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (_err) {
    // noop
  }
}
