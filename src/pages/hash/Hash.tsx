import { Box, Checkbox, Group, Input, Stack, Text } from "@mantine/core";
import { MD5, SHA1, SHA224, SHA256, SHA512 } from "crypto-js";
import { useCallback, useMemo, useState } from "react";

import { CopyButton } from "@/components/CopyButton";
import { MonacoEditor } from "@/components/Monaco/Editor";

const DEFAULT_HASHES = {
  md5: "",
  sha1: "",
  sha256: "",
  sha512: "",
  sha224: "",
};

export default function HashText() {
  const [input, setInput] = useState("");
  const [hashOutput, setHashOutput] = useState(DEFAULT_HASHES);
  const [upper, setUpper] = useState(true);

  const HASH_ALGOS = useMemo(
    () => [
      { key: "md5", label: "MD5", fn: (v: string) => MD5(v).toString() },
      { key: "sha1", label: "SHA1", fn: (v: string) => SHA1(v).toString() },
      { key: "sha224", label: "SHA224", fn: (v: string) => SHA224(v).toString() },
      { key: "sha256", label: "SHA256", fn: (v: string) => SHA256(v).toString() },
      { key: "sha512", label: "SHA512", fn: (v: string) => SHA512(v).toString() },
    ],
    []
  );

  const updateInputValue = async (value: string | undefined = "") => {
    setInput(value);
    if (!value) {
      setHashOutput({ ...DEFAULT_HASHES });
      return;
    }
    generateHashOutput(value);
  };

  const generateHashOutput = useCallback(
    (val: string) => {
      const next: any = {};
      HASH_ALGOS.forEach(a => {
        let h = a.fn(val);
        h = upper ? h.toUpperCase() : h.toLowerCase();
        next[a.key] = h;
      });
      setHashOutput(next);
    },
    [HASH_ALGOS, upper]
  );

  return (
    <Stack h="100%" className="overflow-padding overflow-auto">
      <Box flex={1} style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}>
        <MonacoEditor
          defaultValue="// Add your text here..."
          value={input}
          setValue={updateInputValue}
          height="100%"
          width="100%"
          language="text"
          extraOptions={{ wordWrap: "on", automaticLayout: true }}
        />
      </Box>
      <Stack gap="xs" pr="sm">
        <Group gap={6} wrap="nowrap" justify="space-between" align="center">
          <Checkbox
            size="xs"
            label="Uppercase"
            checked={upper}
            onChange={e => {
              setUpper(e.target.checked);
            }}
          />
          <CopyButton
            size="xs"
            variant="light"
            label="Copy All"
            value={HASH_ALGOS.map(
              a => `${a.label}: ${hashOutput[a.key as keyof typeof hashOutput]}`
            ).join("\n")}
          />
        </Group>
        <Stack gap={4}>
          {HASH_ALGOS.map(a => (
            <Group key={a.key} gap={4} wrap="nowrap">
              <Text w={70} size="xs" c="dimmed">
                {a.label}
              </Text>
              <Input size="xs" value={(hashOutput as any)[a.key]} readOnly w="100%"></Input>
              <CopyButton
                styles={{
                  label: {
                    jus: "flex-start",
                  },
                }}
                fullWidth={false}
                w={120}
                size="xs"
                variant="light"
                value={(hashOutput as any)[a.key]}
                label={a.label}
              />
            </Group>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
