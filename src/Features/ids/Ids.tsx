import {
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
  Text,
  Divider,
  Alert,
  Progress,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useCallback, useEffect, useState } from "react";
import { BsArrowRepeat, BsInfoCircle } from "react-icons/bs";
import { CopyButton } from "@/Components/CopyButton";
import { Generator, GeneratorConfig } from "./types/ids";
import { generateBulkIds, generatorOptions } from "./utils/generators";
import IdInspector from "./components/IdInspector";

export default function Ids() {
  const [ids, setIds] = useState<string[]>([]);
  const [count, setCount] = useInputState<number>(5);
  const [generator, setGenerator] = useInputState<Generator>("v4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Configuration states
  const [customConfig, setCustomConfig] = useInputState<{
    alphabet: string;
    length: number;
  }>({
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    length: 16,
  });

  const [uuidConfig, setUuidConfig] = useInputState<{
    namespace: string;
    name: string;
  }>({
    namespace: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // DNS namespace
    name: "example",
  });

  const [snowflakeConfig, setSnowflakeConfig] = useInputState<{
    epoch: number;
    machineId: number;
  }>({
    epoch: 1288834974657, // Twitter epoch
    machineId: Math.floor(Math.random() * 1024),
  });

  const maxCount = 300;
  const selectedOption = generatorOptions.find(option => option.value === generator);

  const generateIds = useCallback(async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const config: GeneratorConfig = {
        custom: customConfig,
        uuidV3V5: uuidConfig,
        snowflake: snowflakeConfig,
      };

      // For larger batches, show progress
      if (count > 50) {
        const batchSize = 50;
        const batches = Math.ceil(count / batchSize);
        const allIds: string[] = [];

        for (let i = 0; i < batches; i++) {
          const currentBatchSize = Math.min(batchSize, count - i * batchSize);
          const batchIds = generateBulkIds(generator, currentBatchSize, config);
          allIds.push(...batchIds);

          setProgress(((i + 1) / batches) * 100);

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        setIds(allIds);
      } else {
        const newIds = generateBulkIds(generator, count, config);
        setIds(newIds);
        setProgress(100);
      }
    } catch (error) {
      console.error("Error generating IDs:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [count, generator, customConfig, uuidConfig, snowflakeConfig]);

  // Set initial IDs
  useEffect(() => {
    generateIds();
  }, [generator]);

  const renderConfigPanel = () => {
    if (generator === "custom") {
      return (
        <Stack gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            Configuration
          </Text>
          <Group>
            <TextInput
              flex={1}
              label="Alphabet"
              value={customConfig.alphabet}
              onChange={e => setCustomConfig({ ...customConfig, alphabet: e.target.value })}
              placeholder="Characters to use"
            />
            <NumberInput
              label="Length"
              value={customConfig.length}
              onChange={e => setCustomConfig({ ...customConfig, length: Number(e) })}
              min={1}
              max={100}
              w={100}
            />
          </Group>
        </Stack>
      );
    }

    if (generator === "v3" || generator === "v5") {
      return (
        <Stack gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            Configuration
          </Text>
          <Group>
            <TextInput
              flex={1}
              label="Namespace"
              value={uuidConfig.namespace}
              onChange={e => setUuidConfig({ ...uuidConfig, namespace: e.target.value })}
              placeholder="UUID namespace"
            />
            <TextInput
              flex={1}
              label="Name"
              value={uuidConfig.name}
              onChange={e => setUuidConfig({ ...uuidConfig, name: e.target.value })}
              placeholder="Name to hash"
            />
          </Group>
        </Stack>
      );
    }

    if (generator === "snowflake") {
      return (
        <Stack gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            Configuration
          </Text>
          <Group>
            <NumberInput
              flex={1}
              label="Epoch"
              value={snowflakeConfig.epoch}
              onChange={e => setSnowflakeConfig({ ...snowflakeConfig, epoch: Number(e) })}
              placeholder="Custom epoch"
            />
            <NumberInput
              flex={1}
              label="Machine ID"
              value={snowflakeConfig.machineId}
              onChange={e => setSnowflakeConfig({ ...snowflakeConfig, machineId: Number(e) })}
              min={0}
              max={1023}
              placeholder="Machine identifier"
            />
          </Group>
        </Stack>
      );
    }

    return null;
  };

  return (
    <Stack className="overflow-padding" h="100%" gap="md" style={{ overflow: "scroll" }}>
      {/* Generator Selection */}
      <Group align="flex-end">
        <NumberInput
          flex={1}
          label="Count"
          placeholder="How many IDs to generate?"
          value={count}
          onChange={e => setCount(Number(e))}
          min={1}
          max={maxCount}
          error={count > maxCount ? `Maximum ${maxCount} IDs allowed` : undefined}
        />
        <Select
          flex={2}
          label="Generator"
          data={generatorOptions.map(option => ({
            value: option.value,
            label: option.label,
          }))}
          value={generator}
          onChange={e => setGenerator(e as Generator)}
        />
        <Button
          onClick={generateIds}
          disabled={isGenerating || count > maxCount}
          loading={isGenerating}
          variant="light"
          leftSection={<BsArrowRepeat size={16} />}
        >
          Generate
        </Button>
      </Group>

      {/* Generator Info */}
      {selectedOption && (
        <Alert icon={<BsInfoCircle size={16} />} variant="light" style={{ overflow: "visible" }}>
          <Text size="sm">
            <strong>{selectedOption.label}:</strong> {selectedOption.description}
          </Text>
          <Text size="xs" c="dimmed" ff="monospace">
            Example: {selectedOption.example}
          </Text>
        </Alert>
      )}

      {/* Configuration Panel */}
      {renderConfigPanel()}

      {/* Progress Bar */}
      {isGenerating && <Progress value={progress} size="sm" animated />}
      <Divider />

      {/* Results */}
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" fw={500} c="dimmed">
            Generated IDs ({ids.length})
          </Text>
          <CopyButton value={ids.join("\n")} variant="subtle" fullWidth={false} label="Copy All" />
        </Group>

        {/* <ScrollArea h={300}> */}
        <Textarea
          readOnly
          minRows={8}
          maxRows={10}
          autosize
          value={ids.join("\n")}
          placeholder="Generated IDs will appear here..."
        />
        {/* </ScrollArea> */}
      </Stack>
      {/* ID Inspector */}
      <IdInspector />
    </Stack>
  );
}
