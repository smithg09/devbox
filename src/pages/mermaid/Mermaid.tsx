import { saveBinaryToFile, saveDataToFile } from "@/utils/functions";
import { MonacoEditor } from "@/components/Monaco/Editor";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { BsDownload } from "react-icons/bs";

const DIAGRAM_TEMPLATES: Record<string, string> = {
  flowchart: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug it]
    D --> B`,
  sequence: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob, how are you?
    B-->>A: Great, thanks!
    A->>B: Can you help me?
    B->>A: Of course!`,
  er: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "listed in"
    USER {
      int id PK
      string name
      string email
    }
    ORDER {
      int id PK
      int userId FK
      date createdAt
    }`,
  gitgraph: `gitGraph
    commit id: "Initial commit"
    branch feature
    checkout feature
    commit id: "Add feature"
    commit id: "Fix bug"
    checkout main
    merge feature id: "Merge feature"
    commit id: "Release v1.0"`,
};

export default function MermaidEditor() {
  const [diagramType, setDiagramType] = useState("flowchart");
  const [code, setCode] = useState(DIAGRAM_TEMPLATES.flowchart);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // Store latest code in a ref so the debounced effect always reads fresh value.
  const latestCode = useRef(code);
  const [renderTick, setRenderTick] = useState(0);

  const triggerRender = (nextCode: string) => {
    latestCode.current = nextCode;
    setCode(nextCode);
    setRenderTick(v => v + 1);
    setError(null);
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const src = latestCode.current.trim();
      if (!src) return;

      // Render inside a throw-away off-screen element using mermaid.run().
      // This API processes a live DOM node directly and does NOT share the
      // same internal render-pipeline state as mermaid.render(), so a prior
      // parse failure cannot poison this path.
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });

        // Validate syntax first via parse() which uses a separate code path.
        // If this throws we show the error WITHOUT touching the render pipeline,
        // so render's internal state is never corrupted by bad input.
        await mermaid.parse(src);

        // Only reaches here when code is valid — render will always succeed.
        const host = document.createElement("div");
        host.style.cssText = "position:fixed;top:-9999px;left:-9999px;visibility:hidden";
        host.innerHTML = `<pre class="mermaid">${src}</pre>`;
        document.body.appendChild(host);

        try {
          await mermaid.run({
            nodes: [host.firstElementChild as HTMLElement],
            suppressErrors: false,
          });
          const svgEl = host.querySelector("svg");
          if (!svgEl) throw new Error("No SVG produced");
          if (!cancelled && previewRef.current) {
            previewRef.current.innerHTML = svgEl.outerHTML;
            setError(null);
          }
        } finally {
          document.body.removeChild(host);
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg: string = e?.message ?? "Invalid diagram syntax";
          setError(msg.split("\n").find(l => l.trim()) ?? msg);
        }
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [renderTick]);

  const exportSvg = async () => {
    if (!previewRef.current) return;
    const svgEl = previewRef.current.querySelector("svg");
    if (!svgEl) return;
    await saveDataToFile(svgEl.outerHTML, "Save SVG", [{ name: "SVG Image", extensions: ["svg"] }]);
  };

  const exportPng = () => {
    if (!previewRef.current) return;
    const svgEl = previewRef.current.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const bbox = svgEl.getBoundingClientRect();
    canvas.width = bbox.width * 2;
    canvas.height = bbox.height * 2;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async blob => {
        if (!blob) return;
        const bytes = new Uint8Array(await blob.arrayBuffer());
        await saveBinaryToFile(bytes, "Save PNG", [{ name: "PNG Image", extensions: ["png"] }]);
      }, "image/png");
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const handleTypeChange = (type: string) => {
    setDiagramType(type);
    triggerRender(DIAGRAM_TEMPLATES[type]);
  };

  return (
    <Stack className="overflow-padding" h="100%" gap={8}>
      <Group justify="space-between" wrap="nowrap">
        <SegmentedControl
          size="xs"
          value={diagramType}
          onChange={handleTypeChange}
          data={[
            { label: "Flowchart", value: "flowchart" },
            { label: "Sequence", value: "sequence" },
            { label: "ER", value: "er" },
            { label: "Gitgraph", value: "gitgraph" },
          ]}
        />
        <Group gap="xs">
          <Tooltip label="Export SVG">
            <ActionIcon variant="light" onClick={exportSvg}>
              <BsDownload size={14} />
            </ActionIcon>
          </Tooltip>
          <Button
            size="xs"
            variant="light"
            leftSection={<BsDownload size={12} />}
            onClick={exportPng}
          >
            PNG
          </Button>
          <Button
            size="xs"
            variant="light"
            leftSection={<BsDownload size={12} />}
            onClick={exportSvg}
          >
            SVG
          </Button>
        </Group>
      </Group>
      <Group
        h="100%"
        wrap="nowrap"
        align="start"
        gap={0}
        style={{ borderRadius: 8, overflow: "hidden", flex: 1 }}
      >
        <Box style={{ flex: 1, height: "100%" }}>
          <MonacoEditor
            language="markdown"
            width="100%"
            height="100%"
            value={code}
            setValue={v => triggerRender(v || "")}
          />
        </Box>
        <Box
          style={{
            flex: 1,
            height: "100%",
            borderLeft: "1px solid var(--mantine-color-dark-4)",
            position: "relative",
          }}
          bg="dark.8"
        >
          {/* Always mounted so previewRef is never null when a render completes */}
          <ScrollArea h="100%" p="md" style={{ display: error ? "none" : "block" }}>
            <div ref={previewRef} style={{ display: "flex", justifyContent: "center" }} />
          </ScrollArea>
          {error && (
            <Stack p="md" gap="xs">
              <Text size="xs" c="red" fw={600}>
                Syntax error
              </Text>
              <Text
                size="xs"
                c="dimmed"
                style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}
              >
                {error}
              </Text>
            </Stack>
          )}
        </Box>
      </Group>
    </Stack>
  );
}
