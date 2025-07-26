import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import copyMonacoEditor from "./plugins/copyMonacoEditor";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [react(), tsconfigPaths(), copyMonacoEditor()],
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },

  build: {
    target: ["chrome95", "edge95", "esnext", "firefox95", "safari16"],
    sourcemap: false,
    rollupOptions: {
      plugins: [],
      output: {
        sourcemap: false,
        manualChunks: {
          "rehype-parse": ["rehype-parse"],
          "rehype-raw": ["rehype-raw"],
          "react-markdown": ["react-markdown"],
        },
      },
    },
  },
});
