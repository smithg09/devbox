import { SidebarTool } from "@/Components/Sidebar/types";
import { tools } from "./tools";

export const sidebarTools: SidebarTool[] = tools.map(tool => ({
  id: tool.id,
  to: tool.path,
  icon: tool.icon,
  text: tool.text,
}));
