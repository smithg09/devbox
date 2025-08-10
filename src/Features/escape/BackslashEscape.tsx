import { CopyButton } from "@/Components/CopyButton";
import { Group, Stack, Text, Textarea, Title } from "@mantine/core";
import { useState } from "react";

const escapeString = (input: string) =>
  input
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\f/g, "\\f")
    .replace(/\v/g, "\\v")
    .replace(/\0/g, "\\0")
    .replace(/\"/g, '\\\"')
    .replace(/\'/g, "\\'");

const unescapeString = (input: string) => {
  // Decode \uXXXX and \xHH first
  let output = input.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, codepoint: string) =>
    String.fromCodePoint(parseInt(codepoint, 16))
  );
  output = output.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  output = output.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  // Standard escapes
  output = output
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\f/g, "\f")
    .replace(/\\v/g, "\v")
    .replace(/\\0(?!\d)/g, "\0")
    .replace(/\\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\//g, "/");

  // Finally, turn \\ into \
  output = output.replace(/\\\\/g, "\\");
  return output;
};

export default function BackslashEscape() {
  const [unescapedText, setUnescapedText] = useState<string>("");
  const [escapedText, setEscapedText] = useState<string>("");

  return (
    <Stack className="overflow-padding overflow-auto" h="100%" gap="md" pt="xl">
      <Group justify="space-between">
        <Title order={4}>Backslash Escape / Unescape</Title>
      </Group>

      <Stack gap={8}>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Unescaped
          </Text>
          <CopyButton
            value={unescapedText}
            size="xs"
            variant="subtle"
            label="Copy"
            fullWidth={false}
          />
        </Group>
        <Textarea
          autosize
          minRows={10}
          value={unescapedText}
          onChange={e => {
            setUnescapedText(e.currentTarget.value);
            setEscapedText(escapeString(e.currentTarget.value));
          }}
          placeholder="Type raw text to escape..."
        />
      </Stack>
      <Stack gap={8}>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Escaped
          </Text>
          <CopyButton
            value={escapedText}
            size="xs"
            variant="subtle"
            label="Copy"
            fullWidth={false}
          />
        </Group>
        <Textarea
          autosize
          minRows={10}
          value={escapedText}
          onChange={e => {
            setUnescapedText(unescapeString(e.currentTarget.value));
            setEscapedText(e.currentTarget.value);
          }}
        />
      </Stack>
    </Stack>
  );
}
