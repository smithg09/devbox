import { MonacoEditor } from "@/components/Monaco/Editor";
import { isTauri } from "@/utils/isTauri";
import {
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { BsTrash, BsWifi, BsWifiOff } from "react-icons/bs";
import { TbWebhook } from "react-icons/tb";

interface WebhookRequest {
  id: number;
  method: string;
  path: string;
  timestamp: string;
  headers: Record<string, string>;
  body: string;
}

let counter = 0;

export default function WebhookInspector() {
  const [port, setPort] = useState<number>(9001);
  const [running, setRunning] = useState(false);
  const [requests, setRequests] = useState<WebhookRequest[]>([]);
  const [selected, setSelected] = useState<WebhookRequest | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const stopRef = useRef<(() => void) | null>(null);

  const startServer = async () => {
    setErrorMsg("");
    if (isTauri()) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const { listen } = await import("@tauri-apps/api/event");
        await invoke("start_webhook_server", { port });
        const unlisten = await listen<WebhookRequest>(
          "webhook-request",
          (e: { payload: WebhookRequest }) => {
            const req = { ...e.payload, id: ++counter, timestamp: new Date().toLocaleTimeString() };
            setRequests(prev => [req, ...prev.slice(0, 199)]);
          }
        );
        stopRef.current = async () => {
          unlisten();
          try {
            await invoke("stop_webhook_server");
          } catch (_e) {
            /* ignore stop errors */
          }
        };
        setRunning(true);
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Failed to start server");
      }
    }
  };

  const stopServer = async () => {
    stopRef.current?.();
    stopRef.current = null;
    setRunning(false);
  };

  useEffect(
    () => () => {
      stopRef.current?.();
    },
    []
  );

  if (!isTauri()) {
    return (
      <Stack className="overflow-padding" gap="md" maw={600}>
        <Group gap="xs">
          <TbWebhook size={18} />
          <Title order={4}>Webhook Inspector</Title>
        </Group>
        <Alert color="blue" title="Desktop app required">
          Webhook Inspector starts a real local HTTP listener on your machine. This feature requires
          the Devbox desktop app (Tauri). Download it from the releases page to use this tool.
        </Alert>
        <Text size="sm" c="dimmed">
          Once running on desktop, you can point any webhook sender to{" "}
          <Code>http://localhost:&lt;port&gt;</Code> and watch payloads arrive in real time — no
          ngrok, no internet tunnel needed.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack className="overflow-padding" h="100%" gap="sm">
      <Group gap="xs">
        <TbWebhook size={18} />
        <Title order={4}>Webhook Inspector</Title>
        <Badge color={running ? "green" : "gray"} size="sm">
          {running ? "listening" : "stopped"}
        </Badge>
      </Group>

      <Group gap="xs">
        <NumberInput
          label="Port"
          value={port}
          onChange={v => setPort(Number(v))}
          min={1024}
          max={65535}
          w={120}
          size="sm"
          disabled={running}
        />
        {running ? (
          <Button
            size="sm"
            color="red"
            variant="light"
            mt={20}
            leftSection={<BsWifiOff size={14} />}
            onClick={stopServer}
          >
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            variant="filled"
            mt={20}
            leftSection={<BsWifi size={14} />}
            onClick={startServer}
          >
            Start
          </Button>
        )}
        {running && (
          <Text size="xs" c="dimmed" mt={22}>
            Listening at <Code>http://localhost:{port}</Code> — send any HTTP request to log it
            here.
          </Text>
        )}
      </Group>
      {errorMsg && (
        <Text size="xs" c="red">
          {errorMsg}
        </Text>
      )}

      <Group align="start" h="100%" gap="sm" wrap="nowrap" style={{ flex: 1, overflow: "hidden" }}>
        <Stack gap={4} w={280} h="100%">
          <Group justify="space-between">
            <Text size="xs" fw={600} tt="uppercase" c="dimmed">
              Requests ({requests.length})
            </Text>
            <Button
              size="xs"
              variant="subtle"
              color="red"
              leftSection={<BsTrash size={10} />}
              onClick={() => {
                setRequests([]);
                setSelected(null);
              }}
            >
              Clear
            </Button>
          </Group>
          <ScrollArea h="100%" style={{ flex: 1 }}>
            <Stack gap={4}>
              {requests.length === 0 ? (
                <Text size="xs" c="dimmed" ta="center" mt="xl">
                  No requests yet
                </Text>
              ) : (
                requests.map(r => (
                  <Paper
                    key={r.id}
                    p="xs"
                    radius="sm"
                    withBorder
                    style={{
                      cursor: "pointer",
                      borderColor:
                        selected?.id === r.id ? "var(--mantine-color-blue-5)" : undefined,
                    }}
                    onClick={() => setSelected(r)}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <Badge size="xs" color="blue" variant="filled">
                        {r.method}
                      </Badge>
                      <Text size="xs" truncate style={{ flex: 1 }}>
                        {r.path}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {r.timestamp}
                      </Text>
                    </Group>
                  </Paper>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Stack>

        <Box style={{ flex: 1, height: "100%" }}>
          {selected ? (
            <Stack h="100%" gap="sm">
              <Group gap="xs">
                <Badge color="blue">{selected.method}</Badge>
                <Code>{selected.path}</Code>
                <Text size="xs" c="dimmed">
                  {selected.timestamp}
                </Text>
              </Group>
              <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                Headers
              </Text>
              <Code block style={{ fontSize: 11 }}>
                {Object.entries(selected.headers)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join("\n")}
              </Code>
              <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                Body
              </Text>
              <Box style={{ flex: 1 }}>
                <MonacoEditor
                  language="json"
                  width="100%"
                  height="100%"
                  value={(() => {
                    try {
                      return JSON.stringify(JSON.parse(selected.body), null, 2);
                    } catch {
                      return selected.body;
                    }
                  })()}
                  setValue={() => {}}
                  options={{ readOnly: true }}
                />
              </Box>
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" ta="center" mt="xl">
              Select a request to inspect it
            </Text>
          )}
        </Box>
      </Group>
    </Stack>
  );
}
