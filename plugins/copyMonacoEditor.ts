import { cpSync } from "node:fs";

import { PluginOption } from "vite";

export default (): PluginOption => {
  return {
    name: "vite-plugin-copy-monaco",
    closeBundle: () => {
      cpSync("./node_modules/monaco-editor/min/vs", "./dist/vs", {
        recursive: true,
        force: true,
      });
    },
  };
};
