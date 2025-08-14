import { SidebarTool } from "@/components/Sidebar/types";
import { sidebarTools as defaultSidebarTools } from "@/constants/sidebar";
import { settingsStore } from "@/utils/store";
import { useCallback, useEffect, useState } from "react";

export const useSidebarState = () => {
  const [sidebarTools, setSidebarTools] = useState<SidebarTool[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadSidebarItems = useCallback(async () => {
    try {
      setError(null);

      const savedSidebarItems = await settingsStore.getTyped("sidebarTools");

      if (!savedSidebarItems || savedSidebarItems.length === 0) {
        setSidebarTools([...defaultSidebarTools]);
        return;
      }

      // Check if saved items count matches default tools count
      if (savedSidebarItems.length !== defaultSidebarTools.length) {
        setSidebarTools([...defaultSidebarTools]);
        await settingsStore.setTyped("sidebarTools", []);
        return;
      }

      // Map saved items to actual tool objects
      const orderedTools = savedSidebarItems
        .map((id: string) => defaultSidebarTools.find(tool => tool.id === id))
        .filter((tool): tool is SidebarTool => tool !== undefined);

      setSidebarTools(orderedTools);
    } catch (err) {
      setError("Failed to load sidebar configuration");
      setSidebarTools([...defaultSidebarTools]);
      console.error("Error loading sidebar items:", err);
    }
  }, []);

  const updateSidebarOrder = useCallback(async (newOrder: SidebarTool[]) => {
    try {
      setSidebarTools(newOrder);
      const orderedIds = newOrder.map(tool => tool.id);
      await settingsStore.updateTyped("sidebarTools", orderedIds);
    } catch (err) {
      setError("Failed to save sidebar configuration");
      console.error("Error saving sidebar order:", err);
    }
  }, []);

  useEffect(() => {
    loadSidebarItems();
  }, [loadSidebarItems]);

  return {
    sidebarTools,
    error,
    updateSidebarOrder,
    reloadSidebar: loadSidebarItems,
  };
};
