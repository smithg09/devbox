import { MonacoEditor } from "@/Components/Monaco/Editor";
import { Box, Button, Group, Stack } from "@mantine/core";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useState } from "react";

export default function SvgPreview() {
  const [svg, setSvg] = useState(`<svg
  stroke="#273988"
  fill="#273988"
  strokeWidth="0"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1ZM4.5 7.65788V16.3469L12 20.689V12L4.5 7.65788Z"></path>
</svg>`);

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
