import { CopyButton } from "@/Components/CopyButton";
import { Alert, Group, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { BsExclamationTriangle } from "react-icons/bs";
import QueryTable from "./components/QueryTable";
import { buildUrl, parseQuery, parseUrl, stringifyQuery } from "./utils/url";

type QueryItem = { id: string; enabled: boolean; key: string; value: string };

const initialState = {
  input: "https://user:pass@example.com:8080/path/seg?foo=bar&foo=2#hash",
  scheme: "",
  username: "",
  password: "",
  hostname: "",
  port: "",
  path: "",
  hash: "",
  queryItems: [] as QueryItem[],
  error: "" as string | undefined,
};

export default function UrlParser() {
  const [state, setState] = useState(initialState);
  const updatingFromPartsRef = useRef(false);

  const rawQuery = useMemo(
    () => stringifyQuery(state.queryItems.filter(x => x.enabled)),
    [state.queryItems]
  );

  // Auto-parse when URL input changes
  useEffect(() => {
    if (updatingFromPartsRef.current) {
      updatingFromPartsRef.current = false;
      return;
    }
    if (!state.input) return;
    const res = parseUrl(state.input);
    if ("error" in res) {
      setState(s => ({ ...s, error: res.error }));
      return;
    }
    const items: QueryItem[] = parseQuery(res.query).map(q => ({
      id: crypto.randomUUID(),
      enabled: true,
      key: q.key,
      value: q.value,
    }));
    setState(s => ({
      ...s,
      error: undefined,
      scheme: res.scheme,
      username: res.username || "",
      password: res.password || "",
      hostname: res.hostname,
      port: res.port || "",
      path: res.path || "",
      hash: res.hash || "",
      queryItems: items,
    }));
  }, [state.input]);

  // Rebuild URL when parts change
  const updateFromParts = (patch: Partial<typeof initialState>) => {
    setState(s => {
      const next = { ...s, ...patch };
      const url = buildUrl({
        scheme: next.scheme,
        username: next.username,
        password: next.password,
        hostname: next.hostname,
        port: next.port,
        path: next.path,
        hash: next.hash,
        query: stringifyQuery(next.queryItems.filter(x => x.enabled)),
      });
      updatingFromPartsRef.current = true;
      return { ...next, input: url, error: undefined };
    });
  };

  return (
    <Stack className="overflow-padding overflow-auto" gap="xs" style={{ height: "100%" }}>
      <Group justify="space-between">
        <Text fw={600}>URL Parser</Text>
        <CopyButton
          value={state.input}
          label="Copy URL"
          size="xs"
          fullWidth={false}
          variant="light"
        />
      </Group>
      <Textarea
        autosize
        minRows={3}
        placeholder="Enter a URL"
        value={state.input}
        onChange={e => setState(s => ({ ...s, input: e.currentTarget.value }))}
      />
      {state.error && (
        <Alert color="red" icon={<BsExclamationTriangle />}>
          {state.error}
        </Alert>
      )}

      <Group align="flex-start" grow>
        <Stack gap="xs" flex={1}>
          <Text fw={600}>Parsed URL</Text>
          <Group grow>
            <TextInput
              label="Protocol"
              value={state.scheme}
              onChange={e => updateFromParts({ scheme: e.currentTarget.value })}
            />
            <TextInput
              label="Hostname"
              value={state.hostname}
              onChange={e => updateFromParts({ hostname: e.currentTarget.value })}
            />
            <TextInput
              label="Port"
              value={state.port}
              onChange={e => updateFromParts({ port: e.currentTarget.value })}
            />
          </Group>
          <Group grow>
            <TextInput
              label="Username"
              value={state.username}
              onChange={e => updateFromParts({ username: e.currentTarget.value })}
            />
            <TextInput
              label="Password"
              value={state.password}
              onChange={e => updateFromParts({ password: e.currentTarget.value })}
            />
          </Group>
          <TextInput
            label="Path"
            value={state.path}
            onChange={e => updateFromParts({ path: e.currentTarget.value })}
          />
          <TextInput
            label="Hash"
            value={state.hash}
            onChange={e => updateFromParts({ hash: e.currentTarget.value })}
          />
        </Stack>

        <Stack gap="xs" w={360}>
          <Group justify="space-between" align="center">
            <Text fw={600}>Raw query</Text>
            <CopyButton value={rawQuery} label="Copy" size="xs" fullWidth={false} variant="light" />
          </Group>
          <TextInput value={rawQuery} readOnly />
          <QueryTable
            items={state.queryItems}
            onChange={items => updateFromParts({ queryItems: items })}
          />
        </Stack>
      </Group>
    </Stack>
  );
}
