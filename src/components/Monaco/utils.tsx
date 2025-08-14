import { editor } from "monaco-editor";

export const defaultMonacoTheme = {
  value: "clouds-midnight",
  label: "Clouds Midnight",
};

export function setMonacoTheme(
  monaco: typeof import("monaco-editor/esm/vs/editor/editor.api"),
  theme: { value: string; label: string }
): void {
  import(`../../../node_modules/monaco-themes/themes/${defaultMonacoTheme.label}.json`)
    .then(data => {
      const name = theme.value ?? "tomorrow-night";
      monaco.editor.defineTheme(name, data);
      monaco.editor.setTheme(name);
    })
    .catch((e: any) => {
      console.error(e);
    });
}

// Global Monaco theme synchronization
export function syncGlobalMonacoTheme(): void {
  // Check if Monaco is loaded globally
  if (typeof window !== "undefined" && (window as any).monaco) {
    const globalMonaco = (window as any).monaco;
    setMonacoTheme(globalMonaco, defaultMonacoTheme);
  }
}

export function monacoOnMountHandler(
  _editor: editor.IStandaloneCodeEditor,
  monaco: typeof import("monaco-editor/esm/vs/editor/editor.api")
): void {
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  });

  setMonacoTheme(monaco, defaultMonacoTheme);
}
