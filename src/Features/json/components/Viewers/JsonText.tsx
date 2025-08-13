import { MonacoEditor } from "@/Components/Monaco/Editor";

export function JsonText({ value }: { value: string }) {
  return (
    <MonacoEditor
      language="json"
      value={value}
      extraOptions={{ readOnly: true, renderLineHighlight: "none" }}
      height="100%"
      onEditorMounted={editor => {
        setTimeout(() => editor.layout(), 0);
      }}
    />
  );
}
