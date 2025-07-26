import { Box, Button, Group, Stack } from "@mantine/core";
import { MonacoEditor } from "@/Components/Monaco/Editor";
import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";

export default function SvgPreview() {
  const [svg, setSvg] = useState("");

  const readFile = async () => {
    const path = await open({
      directory: false,
      multiple: false,
      title: "Open svg file",
      filters: [{ name: "SVG", extensions: ["svg"] }],
    });

    if (path) {
      const data = await readTextFile(path as string);
      setSvg(data);
    }
  };

  return (
    <Stack className="overflow-padding" h="100%" w="100%" style={{ overflow: "visible" }}>
      <Group
        h="100%"
        wrap="nowrap"
        align="start"
        gap={0}
        style={{ borderRadius: "8px", overflow: "hidden" }}
      >
        <MonacoEditor
          language="html"
          width="100%"
          height="100%"
          value={svg}
          setValue={e => setSvg(e || "")}
        />
        <Box
          bg="white"
          h="100vh"
          w="100%"
          dangerouslySetInnerHTML={{
            __html: `${svg}`,
          }}
        ></Box>
      </Group>
      <Button onClick={readFile} variant="light">
        Open SVG
      </Button>
    </Stack>
  );
}
