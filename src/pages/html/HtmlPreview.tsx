import { CopyButton } from "@/components/CopyButton";
import { MonacoEditor } from "@/components/Monaco/Editor";
import { Box, Group, Stack, Switch } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

const input = `<h1>HTML and CSS Preview</h2>
<p>Write HTML and CSS code in the left editor and view output in this panel.</p>`;

const cssInput = `h1 {
  color: red;
}
p {
  background-color: white;
  color: blue;
}
`;

export default function HtmlPreview() {
  const [htmlCode, setHtmlCode] = useState(input);
  const [cssCode, setCssCode] = useState(cssInput);
  const [darkPreview, setDarkPreview] = useState(false);
  const [wrap, setWrap] = useState(true);

  // Shadow root approach so that user CSS (e.g., h1, p) doesn't leak to the entire app.
  // We keep a separate CSS editor; we inject that CSS plus the HTML into an isolated shadow root.
  // NOTE: A <style> tag placed inside normal DOM would still apply globally.
  const hostRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    if (!shadowRef.current) {
      // Create shadow root once
      shadowRef.current = hostRef.current.attachShadow({ mode: "open" });
    }
    if (shadowRef.current) {
      // Compose content: we purposely do not auto-wrap the user's HTML so they can provide full structures.
      // We still allow them to paste <style> inside their HTML; it will remain scoped inside the shadow root.
      const docHtml = `<!DOCTYPE html><style>${cssCode}\n</style><div class="_html-preview-root">${htmlCode}</div>`;
      shadowRef.current.innerHTML = docHtml;
    }
  }, [htmlCode, cssCode]);

  return (
    <Stack className="overflow-padding overflow-auto" h="100%" gap="xs">
      <Group gap="xs" justify="space-between">
        <Group>
          <Switch
            size="xs"
            checked={wrap}
            label="Word Wrap"
            onChange={e => setWrap(e.currentTarget.checked)}
          />
          <Switch
            size="xs"
            checked={!darkPreview}
            label="Switch Output Theme"
            onChange={() => setDarkPreview(p => !p)}
          />
        </Group>
        <CopyButton
          fullWidth={false}
          value={`${htmlCode}<style>${cssCode}</style>`}
          variant="light"
          size="xs"
          label="Copy"
        />
      </Group>
      <Group h="100%" wrap="nowrap" grow align="stretch" gap="xs">
        <Stack gap={8}>
          <Box style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }} h="100%">
            <MonacoEditor
              value={htmlCode}
              setValue={e => setHtmlCode((e as string) || "")}
              language="html"
              extraOptions={{ wordWrap: wrap ? "on" : "off", automaticLayout: true }}
            />
          </Box>
          <Box style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }} h="100%">
            <MonacoEditor
              value={cssCode}
              setValue={e => setCssCode((e as string) || "")}
              language="css"
              extraOptions={{ wordWrap: wrap ? "on" : "off", automaticLayout: true }}
            />
          </Box>
        </Stack>
        <div
          style={{
            flex: 1,
            padding: 12,
            overflow: "auto",
            background: darkPreview ? "#191919" : "#fff",
            color: darkPreview ? "#ddd" : "inherit",
            borderRadius: "var(--mantine-radius-md)",
            position: "relative",
          }}
        >
          {/* Host element for shadow root */}
          <div ref={hostRef} style={{ all: "initial", display: "block" }} />
        </div>
      </Group>
    </Stack>
  );
}
