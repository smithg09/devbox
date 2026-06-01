import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Code,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { BsBroadcast, BsTrash, BsX } from "react-icons/bs";
import { TbPlus } from "react-icons/tb";

interface SseEvent {
  id: number;
  timestamp: string;
  type: string;
  data: string;
  raw: string;
}

interface HeaderRow {
  key: string;
  value: string;
}

const STATUS_COLORS: Record<string, string> = {
  connecting: "yellow",
  connected: "green",
  error: "red",
  closed: "gray",
  idle: "gray",
};

export default function SseDebugger() {
  const [url, setUrl] = useState("https://hacker-news.firebaseio.com/v0/updates.json");
  const [headers, setHeaders] = useState<HeaderRow[]>([{ key: "", value: "" }]);
  const [events, setEvents] = useState<SseEvent[]>([]);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error" | "closed">(
    "idle"
  );
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const counterRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const connect = async () => {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStatus("connecting");
    setErrorMsg("");

    const hdrs: Record<string, string> = { Accept: "text/event-stream" };
    for (const h of headers) {
      if (h.key.trim()) hdrs[h.key.trim()] = h.value.trim();
    }

    try {
      const res = await fetch(url, { headers: hdrs, signal: ac.signal });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      setStatus("connected");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        done = d;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const block of parts) {
          if (!block.trim()) continue;
          let type = "message";
          let data = "";
          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) type = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          let pretty = data;
          try {
            pretty = JSON.stringify(JSON.parse(data), null, 2);
          } catch (_e) {
            /* not valid JSON, keep raw string */
          }
          const evt: SseEvent = {
            id: ++counterRef.current,
            timestamp: new Date().toLocaleTimeString(),
            type,
            data: pretty,
            raw: block,
          };
          setEvents(prev => [...prev.slice(-499), evt]);
        }
      }
      setStatus("closed");
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setStatus("closed");
      } else {
        setStatus("error");
        setErrorMsg(e?.message ?? "Connection failed");
      }
    }
  };

  const disconnect = () => {
    abortRef.current?.abort();
    setStatus("closed");
  };

  const addHeader = () => setHeaders(h => [...h, { key: "", value: "" }]);
  const removeHeader = (i: number) => setHeaders(h => h.filter((_, j) => j !== i));
  const updateHeader = (i: number, field: "key" | "value", val: string) =>
    setHeaders(h => h.map((row, j) => (j === i ? { ...row, [field]: val } : row)));

  const filtered = filter
    ? events.filter(e => e.type.includes(filter) || e.data.includes(filter))
    : events;

  const isActive = status === "connected" || status === "connecting";

  return (
    <Stack className="overflow-padding" h="100%" gap="sm">
      <Group gap="xs">
        <BsBroadcast size={18} />
        <Title order={4}>SSE Debugger</Title>
        <Badge color={STATUS_COLORS[status]} size="sm">
          {status}
        </Badge>
        {errorMsg && (
          <Text size="xs" c="red">
            {errorMsg}
          </Text>
        )}
      </Group>

      <Stack gap={4}>
        <Group gap="xs" wrap="nowrap">
          <TextInput
            placeholder="https://example.com/events"
            value={url}
            onChange={e => setUrl(e.currentTarget.value)}
            style={{ flex: 1 }}
            size="sm"
            styles={{ input: { fontFamily: "monospace" } }}
          />
          {isActive ? (
            <Button size="sm" color="red" variant="light" onClick={disconnect}>
              Disconnect
            </Button>
          ) : (
            <Button size="sm" variant="filled" onClick={connect}>
              Connect
            </Button>
          )}
        </Group>

        <Stack gap={4}>
          {headers.map((h, i) => (
            <Group key={i} gap="xs" wrap="nowrap">
              <TextInput
                placeholder="Header name"
                size="xs"
                value={h.key}
                onChange={e => updateHeader(i, "key", e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder="Value"
                size="xs"
                value={h.value}
                onChange={e => updateHeader(i, "value", e.currentTarget.value)}
                style={{ flex: 2 }}
              />
              <ActionIcon size="sm" variant="subtle" color="red" onClick={() => removeHeader(i)}>
                <BsX size={14} />
              </ActionIcon>
            </Group>
          ))}
          <Button
            size="xs"
            variant="subtle"
            leftSection={<TbPlus size={12} />}
            onClick={addHeader}
            w="fit-content"
          >
            Add header
          </Button>
        </Stack>
      </Stack>

      <Group justify="space-between">
        <Group gap="xs">
          <TextInput
            placeholder="Filter by type or data…"
            size="xs"
            value={filter}
            onChange={e => setFilter(e.currentTarget.value)}
            w={220}
          />
          <Badge size="sm" variant="outline">
            {filtered.length} events
          </Badge>
        </Group>
        <Group gap="xs">
          <Switch
            size="xs"
            label="Auto-scroll"
            checked={autoScroll}
            onChange={e => setAutoScroll(e.currentTarget.checked)}
          />
          <Tooltip label="Clear events">
            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => setEvents([])}>
              <BsTrash size={12} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Box
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid var(--mantine-color-dark-4)",
          borderRadius: 8,
          padding: 8,
          fontFamily: "monospace",
        }}
        bg="dark.9"
      >
        {filtered.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" mt="xl">
            {status === "idle" ? "Connect to an SSE endpoint to see events" : "Waiting for events…"}
          </Text>
        ) : (
          <Stack gap={4}>
            {filtered.map(evt => (
              <Paper key={evt.id} p="xs" radius="sm" bg="dark.8" withBorder={false}>
                <Group gap="xs" mb={2}>
                  <Text size="xs" c="dimmed">
                    {evt.timestamp}
                  </Text>
                  <Badge size="xs" color="blue" variant="light">
                    {evt.type}
                  </Badge>
                </Group>
                <Code block style={{ fontSize: 11, maxHeight: 120, overflow: "auto" }}>
                  {evt.data}
                </Code>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
