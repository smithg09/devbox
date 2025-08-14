import { isTauri as isTauriFromApi } from "@tauri-apps/api/core";

export const isTauri = () => {
  return (
    isTauriFromApi() || (typeof window !== "undefined" && window.location.origin.includes("tauri"))
  );
};
