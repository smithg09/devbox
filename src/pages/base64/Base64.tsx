import { CopyButton } from "@/components/CopyButton";
import { Box, Checkbox, Group, SegmentedControl, Stack, Text, Textarea } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useState } from "react";

type Mode = "encode" | "decode" | "auto";

const toUrlSafe = (s: string, enabled: boolean) =>
  enabled ? s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "") : s;
const fromUrlSafe = (s: string, enabled: boolean) =>
  enabled ? s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4) : s;

export default function Base64() {
  const [execMode, setExecMode] = useState<Mode>("auto");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedInput] = useDebouncedValue(input, 250);

  const detectMode = (value: string): Mode => {
    if (!value) return "encode";
    // crude detection
    if (/^[A-Za-z0-9+/_-]+={0,2}$/u.test(value) && value.length % 4 === 0) return "decode";
    return "encode";
  };

  const encode = (val: string) => {
    try {
      const base = btoa(val);
      let transformed = toUrlSafe(base, urlSafe);
      setOutput(transformed);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to encode");
    }
  };

  const decode = (val: string) => {
    try {
      const padded = fromUrlSafe(val.replace(/\s+/g, ""), urlSafe);
      setOutput(atob(padded));
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to decode");
    }
  };

  const transform = (raw: string) => {
    const effectiveMode = execMode === "auto" ? detectMode(raw) : execMode;
    if (effectiveMode === "encode") encode(raw);
    else decode(raw);
  };

  useEffect(() => {
    transform(debouncedInput);
  }, [debouncedInput, execMode, urlSafe]);

  return (
    <Stack className="overflow-padding overflow-auto" h="100%">
      {error && (
        <Text fz="xs" c="red" fw={700}>
          {error}
        </Text>
      )}
      <Group gap="xs" dir="row" justify="space-between">
        <Group>
          <SegmentedControl
            size="xs"
            value={execMode}
            onChange={e => setExecMode(e as Mode)}
            data={[
              { label: "Encode", value: "encode" },
              { label: "Auto", value: "auto" },
              { label: "Decode", value: "decode" },
            ]}
          />
          <Checkbox
            size="xs"
            label="URL Safe"
            checked={urlSafe}
            onChange={e => setUrlSafe(e.currentTarget.checked)}
          />
        </Group>
        <CopyButton
          fullWidth={false}
          size="xs"
          variant="light"
          value={output}
          label="Copy Output"
        />
      </Group>
      <Group wrap="nowrap" grow style={{ height: "100%", width: "100%" }}>
        <Box
          h="100%"
          w="100%"
          flex={1}
          style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
        >
          <Textarea
            label="Input"
            placeholder="Paste text or base64 here"
            onChange={e => setInput(e.target.value)}
            value={input}
            minRows={18}
            maxRows={20}
            autosize
            spellCheck={false}
            h="100%"
          />
        </Box>
        <Box
          h="100%"
          flex={1}
          style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
        >
          <Textarea
            label="Result"
            minRows={18}
            maxRows={20}
            autosize
            value={output}
            readOnly
            spellCheck={false}
          />
        </Box>
      </Group>
    </Stack>
  );
}
