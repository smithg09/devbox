import { Box, Checkbox, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import YAML from "js-yaml";
import { useCallback, useEffect, useState } from "react";

import { CopyButton } from "@/components/CopyButton";
import { MonacoEditor } from "@/components/Monaco/Editor";

export default function JsonYaml() {
  const [execMode, setExecMode] = useState<"json" | "yaml" | string>("json");
  const [input, setInput] = useState(
    `{\n  \"name\": \"DevBox\",\n  \"features\": [\n    {\n      \"id\": 1,\n      \"name\": \"JSON Formatter\",\n      \"enabled\": true\n    }\n  ]\n}`
  );
  const [output, setOutput] = useState("");
  const [wrap, setWrap] = useState(true);

  const convert = useCallback(
    (value: string) => {
      if (!value) {
        setOutput("");
        return;
      }
      try {
        if (execMode === "json") {
          const parsed = JSON.parse(value);
          const dumped = YAML.dump(parsed, { indent: 2 });
          setOutput(dumped.trim());
        } else {
          const parsed: any = YAML.load(value);
          setOutput(JSON.stringify(parsed, null, 2));
        }
      } catch (e: any) {
        console.error(e);
      }
    },
    [execMode]
  );

  useEffect(() => {
    // Initial conversion on component mount
    convert(input);
  }, []);

  const toggleExecMode = (m: string) => {
    setExecMode(m);
    const tempInput = input;
    setInput(output);
    setOutput(tempInput);
  };

  return (
    <Stack className="overflow-padding" h="100%">
      <Group gap="xs" dir="row" justify="space-between">
        <Group>
          <SegmentedControl
            size="xs"
            value={execMode}
            onChange={e => toggleExecMode(e)}
            data={[
              { value: "json", label: "JSON to YAML" },
              { value: "yaml", label: "YAML to JSON" },
            ]}
          />
          <Checkbox
            size="xs"
            label="Wrap Lines"
            checked={wrap}
            onChange={e => setWrap(e.currentTarget.checked)}
          />
        </Group>
      </Group>
      <Group wrap="nowrap" grow style={{ height: "100%", width: "100%" }}>
        <Stack h="100%" gap={4}>
          <Group justify="space-between" align="center" mb={6}>
            <Text mb={6} fw={550} size="md">
              {execMode === "json" ? "JSON" : "YAML"}
            </Text>
            <CopyButton fullWidth={false} size="xs" variant="light" value={input} label="Copy" />
          </Group>
          <Box h="100%" style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}>
            <MonacoEditor
              value={input}
              language={execMode}
              extraOptions={{ contextmenu: false, wordWrap: wrap ? "on" : "off" }}
              setValue={e => {
                const v = (e as string) || "";
                setInput(v);
                convert(v);
              }}
            />
          </Box>
        </Stack>
        <Stack h="100%" gap={4}>
          <Group justify="space-between" align="center" mb={6}>
            <Text fw={550} size="md">
              {execMode === "json" ? "YAML" : "JSON"}
            </Text>

            <CopyButton fullWidth={false} size="xs" variant="light" value={output} label="Copy" />
          </Group>
          <Box h="100%" style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}>
            <MonacoEditor
              language={execMode === "json" ? "yaml" : "json"}
              value={output}
              extraOptions={{ readOnly: true, contextmenu: false, wordWrap: wrap ? "on" : "off" }}
            />
          </Box>
        </Stack>
      </Group>
    </Stack>
  );
}
