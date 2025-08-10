import React from "react";

export type SidebarTool = {
  id: string;
  to: string;
  icon: React.ReactNode;
  iconColor?: string;
  text: string;
  extra?: string;
  description?: string;
};

export type DropDownItem = {
  label: string;
  value: string;
  icon: React.ReactNode;
  id: string;
};

export type Props = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
};
