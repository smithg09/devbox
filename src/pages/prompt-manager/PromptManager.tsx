import { saveDataToFile } from "@/utils/functions";
import { MonacoEditor } from "@/components/Monaco/Editor";
import { settingsStore } from "@/utils/store";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Code,
  Group,
  Modal,
  Paper,
  PasswordInput,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { BsDownload, BsKey, BsPlay, BsPlus, BsTrash } from "react-icons/bs";
import { TbVersions } from "react-icons/tb";

interface PromptVersion {
  id: string;
  name: string;
  tags: string;
  system: string;
  prompt: string;
  model: string;
  createdAt: number;
  lastRun?: number;
  lastOutput?: string;
}

const MODELS = [
  { label: "claude-sonnet-4-6", value: "claude-sonnet-4-6" },
  { label: "claude-opus-4-8", value: "claude-opus-4-8" },
  { label: "claude-haiku-4-5-20251001", value: "claude-haiku-4-5-20251001" },
  { label: "gpt-4o", value: "gpt-4o" },
  { label: "gpt-4o-mini", value: "gpt-4o-mini" },
];

const STORE_KEY = "promptVersions";

async function loadVersions(): Promise<PromptVersion[]> {
  const data = await settingsStore.get<PromptVersion[]>(STORE_KEY);
  return data ?? [];
}

async function saveVersions(versions: PromptVersion[]): Promise<void> {
  await settingsStore.update(STORE_KEY, versions);
}

function newVersion(): PromptVersion {
  return {
    id: Math.random().toString(36).slice(2),
    name: "Untitled prompt",
    tags: "",
    system: "You are a helpful assistant.",
    prompt: "Hello! Tell me something interesting.",
    model: "claude-sonnet-4-6",
    createdAt: Date.now(),
  };
}

export default function PromptManager() {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selected, setSelected] = useState<PromptVersion | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [running, setRunning] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    loadVersions().then(v => {
      setVersions(v);
      if (v.length > 0) setSelected(v[0]);
    });
    settingsStore.get<string>("promptApiKey").then(k => setHasStoredKey(!!k));
  }, []);

  const persist = async (updated: PromptVersion[]) => {
    setVersions(updated);
    await saveVersions(updated);
  };

  const addVersion = async () => {
    const v = newVersion();
    const updated = [v, ...versions];
    await persist(updated);
    setSelected(v);
  };

  const updateSelected = async (patch: Partial<PromptVersion>) => {
    if (!selected) return;
    const updated = versions.map(v => (v.id === selected.id ? { ...v, ...patch } : v));
    const patched = { ...selected, ...patch };
    setSelected(patched);
    await persist(updated);
  };

  const deleteVersion = async (id: string) => {
    const updated = versions.filter(v => v.id !== id);
    await persist(updated);
    setSelected(updated[0] ?? null);
  };

  const run = async () => {
    if (!selected) return;
    const key = apiKey || (await settingsStore.get<string>("promptApiKey")) || "";
    if (!key) {
      setApiKey("");
      setShowApiModal(true);
      return;
    }
    setRunning(true);
    try {
      const isAnthropic = selected.model.startsWith("claude");
      let output = "";
      if (isAnthropic) {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: selected.model,
            max_tokens: 1024,
            system: selected.system,
            messages: [{ role: "user", content: selected.prompt }],
          }),
        });
        const json = await res.json();
        output = json?.content?.[0]?.text ?? JSON.stringify(json, null, 2);
      } else {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
          body: JSON.stringify({
            model: selected.model,
            messages: [
              { role: "system", content: selected.system },
              { role: "user", content: selected.prompt },
            ],
          }),
        });
        const json = await res.json();
        output = json?.choices?.[0]?.message?.content ?? JSON.stringify(json, null, 2);
      }
      await updateSelected({ lastRun: Date.now(), lastOutput: output });
    } catch (e: any) {
      await updateSelected({ lastOutput: `Error: ${e?.message}` });
    } finally {
      setRunning(false);
    }
  };

  const exportAll = async () => {
    await saveDataToFile(JSON.stringify(versions, null, 2), "Export Prompts", [
      { name: "JSON File", extensions: ["json"] },
    ]);
  };

  const openApiModal = async () => {
    const stored = await settingsStore.get<string>("promptApiKey");
    setApiKey(stored ?? "");
    setShowApiModal(true);
  };

  const saveApiKey = async () => {
    await settingsStore.update("promptApiKey", apiKey);
    setHasStoredKey(!!apiKey);
    setShowApiModal(false);
    run();
  };

  return (
    <Stack className="overflow-padding" h="100%" gap="sm">
      <Group justify="space-between">
        <Group gap="xs">
          <TbVersions size={18} />
          <Title order={4}>Prompt Version Manager</Title>
        </Group>
        <Group gap="xs">
          <Button
            size="xs"
            variant="subtle"
            leftSection={<BsDownload size={12} />}
            onClick={exportAll}
          >
            Export all
          </Button>
          <Tooltip label={hasStoredKey ? "API key saved — click to update" : "Add API key"}>
            <Button
              size="xs"
              variant={hasStoredKey ? "light" : "subtle"}
              color={hasStoredKey ? "green" : undefined}
              leftSection={<BsKey size={12} />}
              onClick={openApiModal}
            >
              {hasStoredKey ? "API key" : "Add API key"}
            </Button>
          </Tooltip>
          <Button size="xs" variant="light" leftSection={<BsPlus size={12} />} onClick={addVersion}>
            New version
          </Button>
        </Group>
      </Group>

      <Group align="start" h="100%" gap="sm" wrap="nowrap" style={{ flex: 1, overflow: "hidden" }}>
        <Stack w={220} h="100%" gap={4}>
          <Text size="xs" fw={600} tt="uppercase" c="dimmed">
            Versions ({versions.length})
          </Text>
          <ScrollArea h="100%" style={{ flex: 1 }}>
            <Stack gap={4}>
              {versions.length === 0 ? (
                <Text size="xs" c="dimmed" ta="center" mt="xl">
                  No versions yet
                </Text>
              ) : (
                versions.map(v => (
                  <Paper
                    key={v.id}
                    p="xs"
                    radius="sm"
                    withBorder
                    style={{
                      cursor: "pointer",
                      borderColor:
                        selected?.id === v.id ? "var(--mantine-color-blue-5)" : undefined,
                    }}
                    onClick={() => setSelected(v)}
                  >
                    <Group justify="space-between" wrap="nowrap" gap={4}>
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="xs" fw={600} truncate>
                          {v.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {v.model}
                        </Text>
                        {v.lastRun && (
                          <Text size="xs" c="dimmed">
                            ran {new Date(v.lastRun).toLocaleDateString()}
                          </Text>
                        )}
                      </Stack>
                      <Tooltip label="Delete">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={e => {
                            e.stopPropagation();
                            deleteVersion(v.id);
                          }}
                        >
                          <BsTrash size={10} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Paper>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Stack>

        {selected ? (
          <ScrollArea style={{ flex: 1, height: "100%" }} offsetScrollbars>
            <Stack gap="sm" pr={4}>
              <Group gap="xs">
                <TextInput
                  value={selected.name}
                  onChange={e => updateSelected({ name: e.currentTarget.value })}
                  size="xs"
                  style={{ flex: 1 }}
                  placeholder="Version name"
                />
                <TextInput
                  value={selected.tags}
                  onChange={e => updateSelected({ tags: e.currentTarget.value })}
                  size="xs"
                  w={160}
                  placeholder="Tags (comma-separated)"
                />
                <Select
                  data={MODELS}
                  value={selected.model}
                  onChange={v => updateSelected({ model: v ?? selected.model })}
                  size="xs"
                  w={220}
                />
                <Button
                  size="xs"
                  variant="filled"
                  leftSection={<BsPlay size={12} />}
                  loading={running}
                  onClick={run}
                >
                  Run
                </Button>
              </Group>

              <Stack gap={4}>
                <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                  System prompt
                </Text>
                <Box h={120}>
                  <MonacoEditor
                    language="markdown"
                    width="100%"
                    height="100%"
                    value={selected.system}
                    setValue={v => updateSelected({ system: v || "" })}
                  />
                </Box>
              </Stack>

              <Stack gap={4}>
                <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                  User prompt
                </Text>
                <Box h={300}>
                  <MonacoEditor
                    language="markdown"
                    width="100%"
                    height="100%"
                    value={selected.prompt}
                    setValue={v => updateSelected({ prompt: v || "" })}
                  />
                </Box>
              </Stack>

              {selected.lastOutput && (
                <Stack gap={4}>
                  <Group gap="xs">
                    <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                      Last output
                    </Text>
                    {selected.lastRun && (
                      <Badge size="xs" variant="outline">
                        {new Date(selected.lastRun).toLocaleString()}
                      </Badge>
                    )}
                  </Group>
                  <Code block style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
                    {selected.lastOutput}
                  </Code>
                </Stack>
              )}
            </Stack>
          </ScrollArea>
        ) : (
          <Text size="sm" c="dimmed" ta="center" mt="xl" style={{ flex: 1 }}>
            Create a new version or select one from the list
          </Text>
        )}
      </Group>

      <Modal
        opened={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={hasStoredKey ? "Edit API Key" : "Add API Key"}
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Enter your Anthropic or OpenAI API key. Stored locally on your device only.
          </Text>
          <PasswordInput
            label="API Key"
            value={apiKey}
            onChange={e => setApiKey(e.currentTarget.value)}
            placeholder="sk-ant-... or sk-..."
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setShowApiModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveApiKey}>{hasStoredKey ? "Update & Run" : "Save & Run"}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
