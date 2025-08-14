import { ActionIcon, Button, Checkbox, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import React from "react";
import { BsPlus, BsTrash3 } from "react-icons/bs";
import { KeyValue } from "../types/graphql";

interface HeadersEditorProps {
  headers: KeyValue[];
  onChange: (headers: KeyValue[]) => void;
}

export const HeadersEditor: React.FC<HeadersEditorProps> = ({ headers, onChange }) => {
  const updateHeader = (id: string, field: keyof KeyValue, value: any) => {
    const updated = headers.map(h => (h.id === id ? { ...h, [field]: value } : h));
    onChange(updated);
  };

  const addHeader = () => {
    onChange([
      ...headers,
      {
        id: crypto.randomUUID(),
        key: "",
        value: "",
        enabled: true,
      },
    ]);
  };

  const removeHeader = (id: string) => {
    // Don't remove if it's the last header or the auth header preset
    if (headers.length > 1 && id !== "auth-header") {
      onChange(headers.filter(h => h.id !== id));
    }
  };

  const addBearerToken = () => {
    const authHeader = headers.find(h => h.id === "auth-header");
    if (authHeader && !authHeader.enabled) {
      updateHeader("auth-header", "enabled", true);
    }
  };

  return (
    <Paper p="sm" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            Headers
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              onClick={addBearerToken}
              disabled={headers.find(h => h.id === "auth-header")?.enabled}
            >
              Add Bearer Token
            </Button>
            <Button
              size="xs"
              variant="light"
              leftSection={<BsPlus size={18} />}
              onClick={addHeader}
            >
              Add Header
            </Button>
          </Group>
        </Group>

        <Stack gap="xs">
          {headers.map(header => (
            <Group key={header.id} gap="xs" align="center">
              <Checkbox
                checked={header.enabled}
                onChange={e => updateHeader(header.id, "enabled", e.currentTarget.checked)}
              />
              <TextInput
                placeholder="Header name"
                value={header.key}
                onChange={e => updateHeader(header.id, "key", e.currentTarget.value)}
                disabled={!header.enabled}
                style={{ flex: 1 }}
                size="sm"
              />
              <TextInput
                placeholder="Header value"
                value={header.value}
                onChange={e => updateHeader(header.id, "value", e.currentTarget.value)}
                disabled={!header.enabled}
                style={{ flex: 2 }}
                size="sm"
                type={header.key.toLowerCase() === "authorization" ? "password" : "text"}
              />
              <ActionIcon
                size="sm"
                color="red"
                variant="subtle"
                onClick={() => removeHeader(header.id)}
                disabled={headers.length === 1 || header.id === "auth-header"}
              >
                <BsTrash3 size={14} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};
