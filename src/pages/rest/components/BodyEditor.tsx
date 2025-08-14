import { monacoOnMountHandler } from "@/components/Monaco/utils";
import { Group, Radio } from "@mantine/core";
import Editor from "@monaco-editor/react";
import { useMemo } from "react";
import { BodyMode, RequestBody } from "../types/rest";

type Props = {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
};

const modes: BodyMode[] = ["none", "json", "xml", "text"];

export default function BodyEditor({ body, onChange }: Props) {
  const language = useMemo(() => {
    if (body.mode === "json") return "json";
    if (body.mode === "xml") return "xml";
    if (body.mode === "text") return "plaintext";
    return "plaintext";
  }, [body.mode]);

  return (
    <div style={{ height: 240, display: "flex", flexDirection: "column", gap: 8 }}>
      <Group justify="space-between">
        <Radio.Group
          size="xs"
          value={body.mode}
          onChange={v => {
            onChange(
              v === "none"
                ? { mode: "none" }
                : {
                    mode: v as Exclude<BodyMode, "none" | "form" | "multipart">,
                    text: (body as any).text || "",
                  }
            );
          }}
          name="body-mode"
        >
          <Group mt="xs">
            {modes.map(m => (
              <Radio key={m} value={m} label={m.toUpperCase()} />
            ))}
          </Group>
        </Radio.Group>
      </Group>

      {body.mode !== "none" && (
        <div
          style={{
            flex: 1,
            minHeight: 180,
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
          }}
        >
          <Editor
            height="100%"
            defaultLanguage={language}
            value={(body as any).text || ""}
            onChange={value => onChange({ ...(body as any), text: value || "" })}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: "on",
              scrollBeyondLastLine: false,
            }}
            onMount={monacoOnMountHandler}
          />
        </div>
      )}
    </div>
  );
}
