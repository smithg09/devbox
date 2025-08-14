import { settingsStore } from "@/utils/store";
import { useCallback, useEffect, useState } from "react";

export type RecentTool = { id: string; path: string; usedAt: number };

export function useRecentTools() {
  const [recent, setRecent] = useState<RecentTool[]>([]);

  const load = useCallback(async () => {
    const saved = (await settingsStore.getTyped("recentTools")) || [];
    setRecent(saved.sort((a, b) => b.usedAt - a.usedAt));
  }, []);

  const clearRecent = useCallback(async () => {
    await settingsStore.updateTyped("recentTools", []);
    setRecent([]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { recent, reloadRecent: load, clearRecent };
}
