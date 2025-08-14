import { isTauri } from "@/utils/isTauri";

export type ConfirmOptions = {
  title?: string;
  okLabel?: string;
  cancelLabel?: string;
  kind?: "info" | "warning" | "error";
};

export async function confirmDialog(message: string, options?: ConfirmOptions): Promise<boolean> {
  if (isTauri()) {
    try {
      const mod: any = await import("@tauri-apps/plugin-dialog");
      if (typeof mod.confirm === "function") {
        return await mod.confirm(message, {
          title: options?.title ?? "Confirm",
          okLabel: options?.okLabel ?? "Yes",
          cancelLabel: options?.cancelLabel ?? "Cancel",
          kind: options?.kind ?? "warning",
        });
      }
    } catch (_e) {
      // fall through to browser confirm
    }
  }
  return window.confirm(message);
}
