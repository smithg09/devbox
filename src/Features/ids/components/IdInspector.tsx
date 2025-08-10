import { CopyButton } from "@/Components/CopyButton";
import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useState } from "react";
import { BsSearch } from "react-icons/bs";
import { IdInspectionResult } from "../types/ids";
import { inspectId } from "../utils/validators";

export default function IdInspector() {
  const [inputId, setInputId] = useInputState("");
  const [result, setResult] = useState<IdInspectionResult | null>(null);

  const handleInspect = () => {
    if (!inputId.trim()) return;

    const inspectionResult = inspectId(inputId.trim());
    setResult(inspectionResult);
  };

  const formatMetadataValue = (key: string, value: any): string => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Card p="md" mb={12} style={{ overflow: "visible" }}>
      <Stack gap="md">
        <Group align="flex-end">
          <Title order={4} c="dimmed">
            ID Inspector
          </Title>
          <Text size="sm" c="dimmed">
            Analyze and decode existing IDs
          </Text>
        </Group>

        <Group>
          <TextInput
            flex={1}
            placeholder="Paste any ID here to analyze..."
            value={inputId}
            onChange={setInputId}
            onKeyDown={e => e.key === "Enter" && handleInspect()}
          />
          <Button
            onClick={handleInspect}
            disabled={!inputId.trim()}
            variant="light"
            leftSection={<BsSearch size={16} />}
          >
            Inspect
          </Button>
        </Group>

        {result && (
          <Card withBorder>
            <Stack gap="md">
              <Group justify="space-between" wrap="nowrap">
                <Group>
                  <Text fw={500}>Analysis Result</Text>
                  <Badge color={result.valid ? "green" : "red"} variant="light">
                    {result.valid ? "Valid" : "Invalid"}
                  </Badge>
                  <Badge color={result.type === "unknown" ? "gray" : "blue"} variant="light">
                    {result.type === "unknown" ? "Unknown Type" : result.type.toUpperCase()}
                  </Badge>
                </Group>
                <CopyButton
                  value={inputId}
                  variant="subtle"
                  fullWidth={false}
                  label="Copy ID"
                  size="xs"
                />
              </Group>

              <Divider />

              <SimpleGrid cols={2} spacing="md">
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="dimmed">
                    Type
                  </Text>
                  <Text size="sm">
                    {result.type === "unknown" ? "Unknown" : result.type.toUpperCase()}
                  </Text>
                </Stack>

                <Stack gap="xs">
                  <Text size="sm" fw={500} c="dimmed">
                    Format
                  </Text>
                  <Text size="sm" ff="monospace">
                    {result.format}
                  </Text>
                </Stack>

                <Stack gap="xs" style={{ gridColumn: "1 / -1" }}>
                  <Text size="sm" fw={500} c="dimmed">
                    Description
                  </Text>
                  <Text size="sm">{result.description}</Text>
                </Stack>
              </SimpleGrid>

              {result.metadata && Object.keys(result.metadata).length > 0 && (
                <>
                  <Divider />
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      Metadata
                    </Text>
                    <Stack gap="xs">
                      {Object.entries(result.metadata).map(([key, value]) => (
                        <Group key={key} justify="space-between">
                          <Text size="sm" fw={500} tt="capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </Text>
                          <Text size="sm" ff="monospace">
                            {formatMetadataValue(key, value)}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  </Stack>
                </>
              )}
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
