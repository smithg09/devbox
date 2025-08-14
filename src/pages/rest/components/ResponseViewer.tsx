import { monacoOnMountHandler } from "@/components/Monaco/utils";
import {
  ActionIcon,
  Badge,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";
import { BsCopy } from "react-icons/bs";
import { RestResponse } from "../types/rest";

type Props = {
  response?: RestResponse;
  error?: string;
};

export default function ResponseViewer({ response, error }: Props) {
  const [tab, setTab] = useState<"body" | "headers">("body");

  if (error) return <Text color="red">{error}</Text>;
  if (!response)
    return (
      <>
        <strong>Response</strong>
        <Text c="dimmed" fz="sm">
          No response yet
        </Text>
      </>
    );

  const pretty = useMemo(() => {
    if (response.body.kind === "json") return JSON.stringify(response.body.json, null, 2);
    return response.body.text || "";
  }, [response]);

  const copyBody = async () => {
    const text =
      response.body.kind === "json"
        ? JSON.stringify(response.body.json, null, 2)
        : response.body.text || "";
    await navigator.clipboard.writeText(text);
  };

  return (
    <Stack gap="sm" flex={1} style={{ height: "100%" }}>
      <Group justify="space-between">
        <Group>
          <strong>Response</strong>
          <Tooltip label="Copy body">
            <ActionIcon variant="subtle" onClick={copyBody}>
              <BsCopy size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Group>
          <Group gap="xs" mb={4}>
            <Badge size="sm" variant="light" color={response.status >= 400 ? "red" : "green"}>
              {response.status} {response.statusText}
            </Badge>
            <Badge size="sm" variant="light">
              {response.timeMs.toFixed(0)}ms
            </Badge>
            <Badge size="sm" variant="light">
              {response.body.kind}
            </Badge>
          </Group>
          <SegmentedControl
            value={tab}
            size="xs"
            onChange={v => setTab(v as any)}
            data={[
              { label: "Body", value: "body" },
              { label: "Headers", value: "headers" },
            ]}
          />
        </Group>
      </Group>
      {tab === "body" && (
        <div
          style={{
            flex: 1,
            minHeight: 200,
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
          }}
        >
          <Editor
            height="100%"
            defaultLanguage={
              response.body.kind === "json"
                ? "json"
                : response.body.kind === "html"
                  ? "html"
                  : "plaintext"
            }
            value={pretty}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: "on",
              lineNumbers: "off",
              scrollBeyondLastLine: false,
            }}
            onMount={monacoOnMountHandler}
          />
        </div>
      )}
      {tab === "headers" && (
        <Table striped withTableBorder withColumnBorders>
          <Table.Tbody>
            {Object.entries(response.headers).map(([k, v]) => (
              <Table.Tr key={k}>
                <Table.Td>{k}</Table.Td>
                <Table.Td>{v}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
