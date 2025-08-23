import { Button, Flex, Group, NativeSelect, Stack, TextInput, Tooltip } from "@mantine/core";
import { useEffect, useRef } from "react";
import { LayoutType } from "../Rest";
import { HttpMethod, RequestTab } from "../types/rest";
import RequestEditor from "./RequestEditor";
import ResponseViewer from "./ResponseViewer";
import { toCurl } from "../utils/curl";
import { CopyButton } from "@/components/CopyButton";

type Props = {
  tab: RequestTab;
  onChange: (tab: RequestTab) => void;
  onSend: () => void;
  onCancel: () => void;
  sending: boolean;
  layout: LayoutType;
};

const methods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export default function RestEditor({ tab, onChange, onSend, sending, layout }: Props) {
  const set = (patch: Partial<RequestTab>) => onChange({ ...tab, ...patch, meta: { dirty: true } });
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        onSend();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onSend]);

  const methodSelect = (
    <NativeSelect
      data={methods}
      value={tab.method}
      onChange={e => set({ method: e.currentTarget.value as HttpMethod })}
      w={100}
      styles={{
        input: {
          border: "none",
          backgroundColor: "transparent",
        },
        root: {
          borderRight: "1px solid var(--mantine-color-gray-8)",
        },
      }}
    />
  );

  const urlInput = (
    <TextInput
      ref={urlRef}
      placeholder="https://api.example.com/users"
      value={tab.url}
      onChange={e => set({ url: e.currentTarget.value })}
      style={{ flex: 1 }}
      styles={{
        input: {
          border: "none",
          backgroundColor: "transparent",
        },
      }}
    />
  );

  return (
    <Stack gap="sm" style={{ overflow: "scroll" }}>
      <Group wrap="nowrap" gap={6}>
        <Flex
          flex={1}
          styles={{
            root: {
              border: "1px solid var(--mantine-color-gray-8)",
              backgroundColor: "var(--mantine-color-dark-6)",
              borderRadius: "var(--mantine-radius-md)",
            },
          }}
        >
          {methodSelect}
          {urlInput}
        </Flex>
        <Button onClick={onSend} loading={sending} disabled={sending} variant="light">
          Send
        </Button>
        <Tooltip label="Copy CURL" withArrow>
          <CopyButton
            value={toCurl(tab)}
            label="cURL"
            size="sm"
            variant="light"
            fullWidth={false}
          />
        </Tooltip>
      </Group>

      {layout === "vertical" ? (
        <Stack gap="sm" style={{ flex: 1 }}>
          <RequestEditor tab={tab} set={set} />
          <div style={{ flex: 1, minHeight: 240, height: "100%" }}>
            <ResponseViewer response={tab.lastResponse} error={tab.lastError} />
          </div>
        </Stack>
      ) : (
        <Group align="flex-start" grow>
          <div
            style={{
              flex: 1,
              gap: "var(--mantine-spacing-sm)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <RequestEditor tab={tab} set={set} />
          </div>
          <div style={{ flex: 1, minHeight: 400, height: "100%" }}>
            <ResponseViewer response={tab.lastResponse} error={tab.lastError} />
          </div>
        </Group>
      )}
    </Stack>
  );
}
