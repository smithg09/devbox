// @ts-nocheck
import "./markdown.css";

import { Box, Group, ScrollArea } from "@mantine/core";
import { MonacoEditor } from "@/Components/Monaco/Editor";
import { useRef, useEffect, useState } from "react";

import "katex/dist/katex.min.css";
import MdPreview from "./MarkdownPreview";

const MarkdownEditor = ({
  file,
  previewFile,
  setFile,
  showPreview = true,
  showEditor = true,
}: {
  file: string;
  previewFile?: string;
  setFile: (file: string) => void;
  showPreview?: boolean;
  showEditor?: boolean;
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [lastScrollSource, setLastScrollSource] = useState<"editor" | "preview" | null>(null);

  // Handle scroll synchronization
  const handleEditorScroll = () => {
    if (!previewRef.current || !editorRef.current || lastScrollSource === "preview") return;

    const editor = editorRef.current;
    const preview = previewRef.current;

    try {
      const editorScrollTop = editor.getScrollTop();
      const editorScrollHeight = editor.getScrollHeight();
      const editorHeight = editor.getLayoutInfo().height;

      const scrollRatio = editorScrollTop / (editorScrollHeight - editorHeight);
      const previewScrollHeight = preview.scrollHeight;
      const previewHeight = preview.clientHeight;

      const targetScroll = scrollRatio * (previewScrollHeight - previewHeight);

      setLastScrollSource("editor");
      preview.scrollTop = Math.max(0, targetScroll);

      setTimeout(() => setLastScrollSource(null), 100);
    } catch (error) {
      // Ignore scroll sync errors
    }
  };

  const handlePreviewScroll = () => {
    if (!previewRef.current || !editorRef.current || lastScrollSource === "editor") return;

    const editor = editorRef.current;
    const preview = previewRef.current;

    try {
      const previewScrollTop = preview.scrollTop;
      const previewScrollHeight = preview.scrollHeight;
      const previewHeight = preview.clientHeight;

      const scrollRatio = previewScrollTop / (previewScrollHeight - previewHeight);
      const editorScrollHeight = editor.getScrollHeight();
      const editorHeight = editor.getLayoutInfo().height;

      const targetScroll = scrollRatio * (editorScrollHeight - editorHeight);

      setLastScrollSource("preview");
      editor.setScrollTop(Math.max(0, targetScroll));

      setTimeout(() => setLastScrollSource(null), 100);
    } catch (error) {
      // Ignore scroll sync errors
    }
  };

  useEffect(() => {
    const preview = previewRef.current;
    if (preview) {
      preview.addEventListener("scroll", handlePreviewScroll);
      return () => preview.removeEventListener("scroll", handlePreviewScroll);
    }
  }, [showPreview]);

  return (
    <Group style={{ width: "100%", height: "100%" }} grow gap={0}>
      {showEditor ? (
        <Box
          style={{
            width: showPreview ? "50%" : "100%",
            height: "100%",
            borderRight: showPreview ? "1px solid var(--mantine-color-gray-6)" : "none",
          }}
        >
          <MonacoEditor
            setValue={e => setFile(e || "")}
            value={file}
            language="markdown"
            onEditorMounted={editor => {
              editorRef.current = editor;

              // Disable link opening
              editor.getContribution(
                "editor.linkDetector"
              ).openerService._defaultExternalOpener.openExternal = () => {};

              // Add scroll listener
              editor.onDidScrollChange(handleEditorScroll);

              // Enable word wrap by default
              editor.updateOptions({
                wordWrap: "on",
                lineNumbers: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              });
            }}
          />
        </Box>
      ) : null}
      {showPreview ? (
        <Box style={{ width: showEditor ? "50%" : "100%", height: "100%" }}>
          <ScrollArea style={{ height: "100%" }} scrollbarSize={8} scrollHideDelay={1000}>
            <div
              ref={previewRef}
              style={{
                height: "100%",
                overflow: "auto",
              }}
            >
              <MdPreview
                source={previewFile ?? file}
                style={{
                  padding: "20px",
                  minHeight: "100%",
                  lineHeight: "1.6",
                }}
              />
            </div>
          </ScrollArea>
        </Box>
      ) : null}
    </Group>
  );
};

export default MarkdownEditor;
