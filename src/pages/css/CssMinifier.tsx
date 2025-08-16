import { Badge, Box, Group, SegmentedControl, Stack } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CopyButton } from "@/components/CopyButton";
import { MonacoEditor } from "@/components/Monaco/Editor";
import { minify as cssMinify } from "csso";
import * as prettier from "prettier";
import postcss from "prettier/plugins/postcss";

export default function CSSMinifier() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [execMode, setExecMode] = useState("minify");

  const gzipSize = useMemo(() => {
    if (!output) return 0;
    try {
      return Math.round(new TextEncoder().encode(output).length * 0.32);
    } catch {
      return 0;
    }
  }, [output]);

  const minifyCSSInput = useCallback(async () => {
    try {
      const minified = cssMinify(input).css;
      setOutput(minified);
    } catch (e) {
      setOutput("[Error] CSS Minifier:" + (e as any).message);
    }
  }, [execMode, input]);

  const formatCSS = useCallback(async () => {
    try {
      const result = await prettier.format(input, {
        endOfLine: "auto",
        parser: "css",
        plugins: [postcss],
      });
      setOutput(result);
    } catch (e) {
      setOutput("[Error] CSS Formatter :" + (e as any).message);
    }
  }, [execMode, input]);

  useEffect(() => {
    if (execMode === "minify") {
      minifyCSSInput();
    } else {
      formatCSS();
    }
  }, [execMode, input, minifyCSSInput, formatCSS]);

  return (
    <Stack className="overflow-padding" h="100%">
      <Group gap="xs" dir="row" justify="space-between">
        <Group>
          <SegmentedControl
            size="xs"
            value={execMode}
            onChange={e => setExecMode(e ?? "Minify")}
            data={[
              { label: "Minify", value: "minify" },
              { label: "Beautify", value: "beautify" },
            ]}
          />
          <Badge variant="light">Gzip≈ {gzipSize} B</Badge>
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
          <MonacoEditor
            value={input}
            language="css"
            setValue={e => setInput(e || "")}
            extraOptions={{ automaticLayout: true }}
          />
        </Box>
        <Box
          h="100%"
          flex={1}
          style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
        >
          <MonacoEditor
            value={output}
            language="css"
            extraOptions={{ readOnly: true, automaticLayout: true }}
          />
        </Box>
      </Group>
    </Stack>
  );
}
