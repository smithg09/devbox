import { SidebarTool } from "@/components/Sidebar/types";
import { isTauri } from "@/utils/isTauri";
import { tools } from "./tools";

export const sidebarTools: SidebarTool[] = tools
  .filter(tool => !tool.desktopOnly || isTauri())
  .map(tool => ({
    to: tool.path,
    ...tool,
  }));
