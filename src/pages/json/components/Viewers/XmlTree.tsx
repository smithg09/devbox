import { Box, Text } from "@mantine/core";
import { XMLParser } from "fast-xml-parser";
import { useMemo } from "react";

type Props = {
  value: string | null;
};

export function XmlTree({ value }: Props) {
  const parsed = useMemo(() => {
    if (!value) return null;
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@",
        preserveOrder: true,
        trimValues: true,
      });
      return parser.parse(value);
    } catch {
      return null;
    }
  }, [value]);

  return (
    <Box style={{ fontFamily: "var(--mantine-font-family-monospace)", fontSize: 12 }}>
      {parsed ? (
        <pre style={{ margin: 0 }}>{JSON.stringify(parsed, null, 2)}</pre>
      ) : (
        <Text size="sm" c="dimmed">
          No valid XML to display
        </Text>
      )}
    </Box>
  );
}
