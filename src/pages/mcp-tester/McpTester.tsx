import { MonacoEditor } from "@/components/Monaco/Editor";
import {
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Collapse,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { TbPlugConnected, TbPlugOff } from "react-icons/tb";

interface McpTool {
  name: string;
  description?: string;
  inputSchema?: any;
}

interface LogEntry {
  dir: "out" | "in";
  timestamp: string;
  payload: string;
}

let msgId = 1;

async function mcpRequest(url: string, method: string, params: any = {}): Promise<any> {
  const body = { jsonrpc: "2.0", id: msgId++, method, params };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("text/event-stream")) {
    const text = await res.text();
    const dataLine = text.split("\n").find(l => l.startsWith("data:"));
    if (!dataLine) throw new Error("No data in SSE response");
    return JSON.parse(dataLine.slice(5).trim());
  }
  return res.json();
}

export default function McpTester() {
  const [serverUrl, setServerUrl] = useState("http://localhost:3000/mcp");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [tools, setTools] = useState<McpTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
  const [argsJson, setArgsJson] = useState("{}");
  const [response, setResponse] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const addLog = (dir: "out" | "in", payload: any) =>
    setLog(prev => [
      {
        dir,
        timestamp: new Date().toLocaleTimeString(),
        payload: JSON.stringify(payload, null, 2),
      },
      ...prev.slice(0, 49),
    ]);

  const connect = async () => {
    setStatus("connecting");
    setErrorMsg("");
    setTools([]);
    setSelectedTool(null);
    try {
      const initPayload = {
        jsonrpc: "2.0",
        id: msgId++,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "Devbox MCP Tester", version: "1.0" },
        },
      };
      addLog("out", initPayload);
      const initRes = await mcpRequest(serverUrl, "initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "Devbox MCP Tester", version: "1.0" },
      });
      addLog("in", initRes);

      const listPayload = { jsonrpc: "2.0", id: msgId++, method: "tools/list", params: {} };
      addLog("out", listPayload);
      const listRes = await mcpRequest(serverUrl, "tools/list", {});
      addLog("in", listRes);

      const toolList: McpTool[] = listRes?.result?.tools ?? [];
      setTools(toolList);
      setStatus("connected");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message ?? "Connection failed");
    }
  };

  const callTool = async () => {
    if (!selectedTool) return;
    let args: any = {};
    try {
      args = JSON.parse(argsJson);
    } catch {
      setResponse("Invalid JSON in arguments");
      return;
    }
    try {
      const params = { name: selectedTool.name, arguments: args };
      addLog("out", { method: "tools/call", params });
      const res = await mcpRequest(serverUrl, "tools/call", params);
      addLog("in", res);
      setResponse(JSON.stringify(res?.result ?? res, null, 2));
    } catch (e: any) {
      setResponse(`Error: ${e?.message}`);
    }
  };

  const selectTool = (tool: McpTool) => {
    setSelectedTool(tool);
    const schema = tool.inputSchema?.properties ?? {};
    const example: Record<string, any> = {};
    for (const [k, v] of Object.entries<any>(schema)) {
      example[k] =
        v.type === "string" ? "" : v.type === "number" ? 0 : v.type === "boolean" ? false : null;
    }
    setArgsJson(JSON.stringify(example, null, 2));
    setResponse("");
  };

  return (
    <Stack className="overflow-padding" h="100%" gap="sm">
      <Group gap="xs">
        <TbPlugConnected size={18} />
        <Title order={4}>MCP Server Tester</Title>
        <Badge
          color={
            status === "connected"
              ? "green"
              : status === "error"
                ? "red"
                : status === "connecting"
                  ? "yellow"
                  : "gray"
          }
          size="sm"
        >
          {status}
        </Badge>
      </Group>

      <Group gap="xs" wrap="nowrap">
        <TextInput
          placeholder="http://localhost:3000/mcp"
          value={serverUrl}
          onChange={e => setServerUrl(e.currentTarget.value)}
          size="sm"
          style={{ flex: 1 }}
          styles={{ input: { fontFamily: "monospace" } }}
        />
        <Button
          size="sm"
          variant={status === "connected" ? "light" : "filled"}
          leftSection={
            status === "connected" ? <TbPlugOff size={14} /> : <TbPlugConnected size={14} />
          }
          loading={status === "connecting"}
          onClick={
            status === "connected"
              ? () => {
                  setStatus("idle");
                  setTools([]);
                }
              : connect
          }
        >
          {status === "connected" ? "Disconnect" : "Connect"}
        </Button>
      </Group>
      {errorMsg && (
        <Text size="xs" c="red">
          {errorMsg}
        </Text>
      )}

      {status !== "connected" && status !== "error" && (
        <Alert color="blue" title="How it works" variant="light">
          Enter your MCP server&apos;s HTTP endpoint, click Connect to run <Code>initialize</Code> +{" "}
          <Code>tools/list</Code>, then pick a tool and fire calls. Works with any server that
          implements the MCP JSON-RPC over HTTP/SSE transport.
        </Alert>
      )}

      {status === "connected" && (
        <Group
          align="start"
          h="100%"
          gap="sm"
          wrap="nowrap"
          style={{ flex: 1, overflow: "hidden" }}
        >
          <Stack w={240} h="100%" gap={4}>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed">
              Tools ({tools.length})
            </Text>
            <ScrollArea h="100%" style={{ flex: 1 }}>
              <Stack gap={4}>
                {tools.map(t => (
                  <Paper
                    key={t.name}
                    p="xs"
                    radius="sm"
                    withBorder
                    style={{
                      cursor: "pointer",
                      borderColor:
                        selectedTool?.name === t.name ? "var(--mantine-color-blue-5)" : undefined,
                    }}
                    onClick={() => selectTool(t)}
                  >
                    <Text size="xs" fw={600}>
                      {t.name}
                    </Text>
                    {t.description && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {t.description}
                      </Text>
                    )}
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Stack>

          <Stack style={{ flex: 1, height: "100%" }} gap="sm">
            {selectedTool ? (
              <>
                <Group gap="xs">
                  <Text size="sm" fw={600}>
                    {selectedTool.name}
                  </Text>
                  {selectedTool.description && (
                    <Text size="xs" c="dimmed">
                      {selectedTool.description}
                    </Text>
                  )}
                </Group>
                <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                  Arguments (JSON)
                </Text>
                <Box h={180}>
                  <MonacoEditor
                    language="json"
                    width="100%"
                    height="100%"
                    value={argsJson}
                    setValue={v => setArgsJson(v || "{}")}
                  />
                </Box>
                <Button size="sm" variant="filled" w="fit-content" onClick={callTool}>
                  Call tool
                </Button>
                {response && (
                  <>
                    <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                      Response
                    </Text>
                    <Box style={{ flex: 1 }}>
                      <MonacoEditor
                        language="json"
                        width="100%"
                        height="100%"
                        value={response}
                        setValue={() => {}}
                        options={{ readOnly: true }}
                      />
                    </Box>
                  </>
                )}
              </>
            ) : (
              <Text size="sm" c="dimmed" ta="center" mt="xl">
                Select a tool from the list to inspect and call it
              </Text>
            )}
          </Stack>
        </Group>
      )}

      <Box>
        <Button size="xs" variant="subtle" onClick={() => setShowLog(v => !v)}>
          {showLog ? "Hide" : "Show"} raw log ({log.length})
        </Button>
        <Collapse in={showLog}>
          <ScrollArea h={180} mt={4}>
            <Stack gap={4}>
              {log.map((entry, i) => (
                <Paper key={i} p="xs" radius="sm" bg={entry.dir === "out" ? "dark.7" : "dark.8"}>
                  <Group gap="xs" mb={2}>
                    <Badge size="xs" color={entry.dir === "out" ? "blue" : "green"}>
                      {entry.dir === "out" ? "→ sent" : "← recv"}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {entry.timestamp}
                    </Text>
                  </Group>
                  <Code block style={{ fontSize: 10 }}>
                    {entry.payload}
                  </Code>
                </Paper>
              ))}
            </Stack>
          </ScrollArea>
        </Collapse>
      </Box>
    </Stack>
  );
}
