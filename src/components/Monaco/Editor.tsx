import Editor, { DiffEditor, DiffOnMount, EditorProps, OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { defaultMonacoTheme, monacoOnMountHandler, setMonacoTheme } from "./utils";

type MonacoEditorProps = {
  value?: string;
  setValue?: (e?: string) => void;
  extraOptions?: editor.IStandaloneDiffEditorConstructionOptions;
  height?: string;
  width?: string;
  onEditorMounted?: OnMount;
  onDiffEditorMounted?: DiffOnMount;
  language: string;
  mode?: "diff" | "regular";
  diffProps?: {
    original: string;
    modified: string;
    modifiedLanguage: string;
    originalLanguage: string;
  };
} & EditorProps;

export const MonacoEditor = ({
  value,
  setValue,
  extraOptions,
  height = "100%",
  width = "100%",
  onEditorMounted,
  language,
  mode,
  onDiffEditorMounted,
  diffProps,
  ...rest
}: MonacoEditorProps) => {
  const diffOnMount: DiffOnMount = (editor, monaco) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });

    setMonacoTheme(monaco, defaultMonacoTheme);

    if (onDiffEditorMounted) {
      onDiffEditorMounted(editor, monaco);
    }
  };

  const onMount: OnMount = (editor, monaco) => {
    monacoOnMountHandler(editor, monaco);

    if (onEditorMounted) {
      onEditorMounted(editor, monaco);
    }
  };

  if (mode === "diff") {
    return <DiffEditor {...diffProps} onMount={diffOnMount} options={{ ...extraOptions }} />;
  }

  return (
    <Editor
      value={value}
      language={language}
      height={height}
      width={width}
      onChange={setValue}
      onMount={onMount}
      options={{
        fontSize: 12,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        smoothScrolling: true,
        wordWrap: "on",
        minimap: {
          enabled: false,
        },
        lineNumbersMinChars: 3,
        ...extraOptions,
      }}
      {...rest}
    />
  );
};
