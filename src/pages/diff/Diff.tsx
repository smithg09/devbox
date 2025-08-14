import { MonacoEditor } from "@/components/Monaco/Editor";
import {
  Box,
  Button,
  Group,
  NativeSelect,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import type { DiffOnMount } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
// types provided via local ambient module declaration
import { useElementSize } from "@mantine/hooks";
import { createTwoFilesPatch } from "diff";
import { XMLParser } from "fast-xml-parser";

const LANGUAGE_OPTIONS = [
  { value: "plaintext", label: "Text" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "markdown", label: "Markdown" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
];

function tryFormatJson(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return input;
  }
}

export default function Diff() {
  const [original, setOriginal] = useState<string>(
    `{\n  \"name\": \"DevBox\",\n  \"features\": [\n    {\n      \"id\": 1,\n      \"name\": \"JSON Formatter\",\n      \"enabled\": true\n    }\n  ]\n}`
  );
  const [modified, setModified] = useState<string>(
    `{\n  \"name\": \"DevBox\",\n  \"features\": [\n    {\n      \"id\": 2,\n      \"name\": \"Diff\",\n      \"enabled\": true\n    }\n  ]\n}`
  );

  const [language, setLanguage] = useState<string>("json");
  const [layout, setLayout] = useState<"side" | "inline">("side");
  const [viewMode, setViewMode] = useState<"editor" | "changes" | "patch">("editor");
  const [ignoreTrimWhitespace, setIgnoreTrimWhitespace] = useState<boolean>(true);
  const [wordWrap, setWordWrap] = useState<boolean>(true);

  const originalRef = useRef<string>(original);
  const modifiedRef = useRef<string>(modified);
  const originalTimerRef = useRef<number | null>(null);
  const modifiedTimerRef = useRef<number | null>(null);
  const debounceMs = 250;
  const { ref: containerRef, width: containerWidth } = useElementSize();
  const MONACO_INLINE_BREAKPOINT = 1150;
  const autoSwitchedRef = useRef<boolean>(false);
  const prevLayoutRef = useRef<"side" | "inline">("side");

  // Auto-switch inline when narrow; revert when wide again if we switched automatically
  useEffect(() => {
    if (!containerWidth) return;
    const isNarrow = containerWidth < MONACO_INLINE_BREAKPOINT;
    if (isNarrow && layout !== "inline") {
      prevLayoutRef.current = layout;
      autoSwitchedRef.current = true;
      setLayout("inline");
    } else if (!isNarrow && autoSwitchedRef.current) {
      autoSwitchedRef.current = false;
      setLayout(prevLayoutRef.current);
    }
  }, [containerWidth, layout]);

  // keep refs in sync
  if (originalRef.current !== original) originalRef.current = original;
  if (modifiedRef.current !== modified) modifiedRef.current = modified;

  // Infer language from the left/original input and update selection
  useEffect(() => {
    const detectLanguageFromContent = (text: string): string => {
      const src = text.trim();
      if (!src) return "plaintext";

      // PHP
      if (/^<\?php/.test(src)) return "php";

      // TypeScript (avoid generic :type annotations to prevent CSS/Markdown collisions)
      if (/\binterface\b|\btype\s+\w+\s*=|\benum\b/.test(src)) {
        return "typescript";
      }

      // JavaScript (anchor to start of line; avoid CSS var() and CSS @import)
      if (/^\s*(function\b|const\s|let\s|var\s|import\s|export\s)/m.test(src) || /=>/.test(src)) {
        return "javascript";
      }

      // HTML (check before XML)
      if (/(<!DOCTYPE\s+html>|<html\b)/i.test(src)) return "html";
      if (/<(div|span|article|header|footer|main|nav|script|style)\b[\s\S]*?>/i.test(src)) {
        return "html";
      }

      // CSS (place before JS to avoid picking up var(...) or @import)
      if (
        /^[^{]+\{[\s\S]*?:[\s\S]*?;[\s\S]*?\}/m.test(src) ||
        /@media\b|@keyframes\b/.test(src) ||
        /^\s*@import\b/m.test(src)
      ) {
        return "css";
      }

      // JSON
      if (src.startsWith("{") || src.startsWith("[")) {
        try {
          JSON.parse(src);
          return "json";
        } catch (e) {
          /* ignore */
        }
      }

      // XML (avoid mis-detecting HTML which we checked above)
      if (src.startsWith("<") && /<\/?[a-zA-Z_][\w\-:.]*[\s\S]*?>/.test(src)) {
        try {
          const parser = new XMLParser({ ignoreAttributes: false });
          // If parsing succeeds and contains an object, treat as XML
          const parsed = parser.parse(src);
          if (parsed && typeof parsed === "object") return "xml";
        } catch (e) {
          /* ignore */
        }
      }

      // Python
      if (/^\s*def\s+\w+\(.*\)\s*:\s*$/m.test(src) || /\bimport\s+\w+\b/.test(src)) {
        return "python";
      }

      // Go
      if (/^\s*package\s+\w+/m.test(src) || /\bfunc\s+\w+\(.*\)\s*\{/m.test(src)) {
        return "go";
      }

      // Rust
      if (/\bfn\s+\w+\s*\(|\blet\s+mut\b|\bimpl\b|\bmatch\b/.test(src)) {
        return "rust";
      }

      // Markdown (after HTML to avoid collisions)
      if (
        /^\s{0,3}#{1,6}\s+.+/m.test(src) ||
        /```[a-zA-Z0-9_-]*/.test(src) ||
        /^\s*[-*+]\s+\S+/m.test(src)
      ) {
        return "markdown";
      }

      return "plaintext";
    };

    const detected = detectLanguageFromContent(original);
    if (detected && detected !== language) {
      setLanguage(detected);
    }
  }, [original]);

  const onDiffMount: DiffOnMount = diffEditor => {
    // Keep editors editable on both sides
    const orig = diffEditor.getOriginalEditor();
    const mod = diffEditor.getModifiedEditor();
    orig.onDidChangeModelContent(() => {
      const value = orig.getValue();
      if (value === originalRef.current) return;
      if (originalTimerRef.current) window.clearTimeout(originalTimerRef.current);
      originalTimerRef.current = window.setTimeout(() => {
        originalRef.current = value;
        setOriginal(value);
      }, debounceMs) as unknown as number;
    });
    mod.onDidChangeModelContent(() => {
      const value = mod.getValue();
      if (value === modifiedRef.current) return;
      if (modifiedTimerRef.current) window.clearTimeout(modifiedTimerRef.current);
      modifiedTimerRef.current = window.setTimeout(() => {
        modifiedRef.current = value;
        setModified(value);
      }, debounceMs) as unknown as number;
    });
  };

  const diffOptions = useMemo(
    () => ({
      originalEditable: true,
      readOnly: false,
      renderSideBySide: layout === "side",
      ignoreTrimWhitespace,
      renderIndicators: true,
      renderOverviewRuler: true,
      wordWrap: wordWrap ? "on" : "off",
    }),
    [layout, ignoreTrimWhitespace, wordWrap]
  );

  //

  // Handlers for file uploads are defined but not currently used in UI
  // Keeping them for potential future integration with file inputs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLoadOriginal = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setOriginal(String(e.target?.result ?? ""));
    reader.readAsText(file);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLoadModified = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setModified(String(e.target?.result ?? ""));
    reader.readAsText(file);
  };

  const prettyPrintIfJson = () => {
    if (language !== "json") return;
    setOriginal(prev => tryFormatJson(prev));
    setModified(prev => tryFormatJson(prev));
  };

  type Change = { path: string; type: "added" | "removed" | "modified"; before?: any; after?: any };

  const computeJsonChanges = (a: string, b: string): Change[] => {
    try {
      const objA = JSON.parse(a);
      const objB = JSON.parse(b);

      const changes: Change[] = [];
      const MAX_CHANGES = 5000;
      let exceeded = false;

      const walk = (left: any, right: any, path: string[]) => {
        if (exceeded) return;
        if (
          typeof left !== "object" ||
          left === null ||
          typeof right !== "object" ||
          right === null
        ) {
          if (JSON.stringify(left) !== JSON.stringify(right)) {
            changes.push({ path: path.join("."), type: "modified", before: left, after: right });
            if (changes.length >= MAX_CHANGES) {
              exceeded = true;
            }
          }
          return;
        }

        const leftKeys = new Set(Object.keys(left));
        const rightKeys = new Set(Object.keys(right));

        for (const key of leftKeys) {
          if (!rightKeys.has(key)) {
            changes.push({ path: [...path, key].join("."), type: "removed", before: left[key] });
            if (changes.length >= MAX_CHANGES) {
              exceeded = true;
              return;
            }
          }
        }
        for (const key of rightKeys) {
          if (!leftKeys.has(key)) {
            changes.push({ path: [...path, key].join("."), type: "added", after: right[key] });
            if (changes.length >= MAX_CHANGES) {
              exceeded = true;
              return;
            }
          } else {
            walk(left[key], right[key], [...path, key]);
          }
          if (exceeded) return;
        }
      };

      walk(objA, objB, []);
      return exceeded
        ? [
            ...changes,
            { path: "(truncated)", type: "modified", before: "…", after: "Too many changes" },
          ]
        : changes;
    } catch {
      // ignore parse errors
    }
    return [];
  };

  const computeXmlChanges = (a: string, b: string): Change[] => {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@",
        trimValues: true,
      });
      const objA = parser.parse(a);
      const objB = parser.parse(b);
      return computeJsonChanges(JSON.stringify(objA), JSON.stringify(objB));
    } catch {
      // ignore parse errors
    }
    return [];
  };

  const changes = useMemo<Change[]>(() => {
    if (viewMode !== "changes") return [];
    if (language === "json") return computeJsonChanges(original, modified);
    if (language === "xml") return computeXmlChanges(original, modified);
    return [];
  }, [viewMode, language, original, modified]);

  const patchText = useMemo(() => {
    if (viewMode !== "patch") return "";
    try {
      return createTwoFilesPatch("left", "right", original, modified, "", "", { context: 3 });
    } catch {
      return "";
    }
  }, [viewMode, original, modified]);

  const copyPatch = async () => {
    try {
      await navigator.clipboard.writeText(patchText);
    } catch {
      // ignore clipboard errors
    }
  };

  const downloadPatch = () => {
    const blob = new Blob([patchText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diff.patch";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack h="100%" p="sm" gap={8}>
      <Group gap={12} justify="space-between">
        <Group gap={6}>
          <NativeSelect
            size="xs"
            w={120}
            data={LANGUAGE_OPTIONS}
            value={language}
            onChange={e => setLanguage(e.currentTarget.value)}
          />
          <Switch
            size="xs"
            checked={ignoreTrimWhitespace}
            onChange={e => setIgnoreTrimWhitespace(e.currentTarget.checked)}
            label="Trim whitespace"
          />
          <Switch
            size="xs"
            checked={wordWrap}
            onChange={e => setWordWrap(e.currentTarget.checked)}
            label="Word wrap"
          />
        </Group>

        <Group gap={6}>
          <SegmentedControl
            size="xs"
            value={layout}
            onChange={v => setLayout(v as any)}
            data={[
              { label: "Side-by-side", value: "side" },
              { label: "Inline", value: "inline" },
            ]}
          />
          <SegmentedControl
            size="xs"
            value={viewMode}
            onChange={v => setViewMode(v as any)}
            data={[
              { label: "Editor", value: "editor" },
              { label: "Changes", value: "changes" },
              { label: "Patch", value: "patch" },
            ]}
          />
        </Group>
      </Group>
      <Group gap={12}>
        {language === "json" ? (
          <Tooltip label="Format both inputs with stable indentation">
            <Button size="xs" variant="light" onClick={prettyPrintIfJson}>
              Pretty print JSON
            </Button>
          </Tooltip>
        ) : null}
      </Group>

      {viewMode === "editor" ? (
        <Box ref={containerRef} style={{ flex: 1, minHeight: 0 }}>
          <MonacoEditor
            mode="diff"
            language={language}
            onDiffEditorMounted={onDiffMount}
            diffProps={{
              original,
              modified,
              originalLanguage: language,
              modifiedLanguage: language,
            }}
            extraOptions={diffOptions as any}
          />
        </Box>
      ) : null}

      {viewMode === "editor" && containerWidth > 0 && containerWidth < MONACO_INLINE_BREAKPOINT ? (
        <Text size="sm" c="orange">
          Side-by-side is not supported for layouts under 1150px. Resize the window to use
          side-by-side.
        </Text>
      ) : null}

      {viewMode === "changes" ? (
        <Stack gap={6} style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <Text size="sm" fw={600}>
            {changes.length} change{changes.length === 1 ? "" : "s"}
          </Text>
          <Box style={{ fontFamily: "var(--mantine-font-family-monospace)", fontSize: 12 }}>
            {changes.length === 0 ? (
              <Text size="sm" c="dimmed">
                No structural changes detected.
              </Text>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {changes.map((c, idx) => (
                  <li key={`${c.path}-${idx}`} style={{ marginBottom: 6 }}>
                    <Text
                      span
                      fw={600}
                      c={c.type === "added" ? "teal" : c.type === "removed" ? "red" : "yellow"}
                    >
                      {c.type.toUpperCase()}
                    </Text>{" "}
                    <Text span>{c.path || "(root)"}</Text>
                    {c.type === "modified" ? (
                      <>
                        <br />
                        <Text c="dimmed">Before: {JSON.stringify(c.before)}</Text>
                        <Text c="dimmed">After: {JSON.stringify(c.after)}</Text>
                      </>
                    ) : c.type === "added" ? (
                      <>
                        <br />
                        <Text c="dimmed">After: {JSON.stringify(c.after)}</Text>
                      </>
                    ) : (
                      <>
                        <br />
                        <Text c="dimmed">Before: {JSON.stringify(c.before)}</Text>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Box>
        </Stack>
      ) : null}

      {viewMode === "patch" ? (
        <Stack gap={8} style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <Group gap={8}>
            <Button size="xs" variant="light" onClick={copyPatch} disabled={!patchText}>
              Copy patch
            </Button>
            <Button size="xs" variant="light" onClick={downloadPatch} disabled={!patchText}>
              Download patch
            </Button>
          </Group>
          <Textarea
            value={patchText}
            minRows={12}
            autosize
            styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)" } }}
          />
        </Stack>
      ) : null}

      <Group gap={12} align="start" wrap="wrap">
        <Box style={{ flex: 1 }}>
          <Text size="sm" fw={600} mb={4}>
            Left (original)
          </Text>
          <Textarea
            minRows={5}
            maxRows={5}
            autosize
            value={original}
            onChange={e => setOriginal(e.currentTarget.value)}
          />
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="sm" fw={600} mb={4}>
            Right (modified)
          </Text>
          <Textarea
            minRows={5}
            maxRows={5}
            autosize
            value={modified}
            onChange={e => setModified(e.currentTarget.value)}
          />
        </Box>
      </Group>

      <Text size="xs" c="dimmed">
        Tip: Use the editors above for quick editing. The diff view is fully editable on both sides.
      </Text>
    </Stack>
  );
}
