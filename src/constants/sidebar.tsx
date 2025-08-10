import { SidebarTool } from "@/Components/Sidebar/types";
import { tools } from "./tools";

export const sidebarTools: SidebarTool[] = tools.map(tool => ({
  to: tool.path,
  ...tool,
}));
