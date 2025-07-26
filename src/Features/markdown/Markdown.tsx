import { Button, Group, Stack, Text, SegmentedControl, Box, CopyButton } from "@mantine/core";
import { BsFileEarmarkText, BsEye, BsLayoutSplit, BsCheck, BsCopy, BsSave } from "react-icons/bs";
import { demoMdFile } from "@/Features/markdown/constants";
import { useState } from "react";
import { useFile } from "@/hooks";
import MarkdownEditor from "@/Features/markdown/Editor";

const Markdown = () => {
  const [viewMode, setViewMode] = useState<"editor" | "both" | "preview">("both");
  const {
    file: source,
    setFile: setSource,
    openFile,
    saveFile,
  } = useFile({
    initialFile: demoMdFile,
  });

  return (
    <Stack className="overflow-padding" gap={0} style={{ height: "100%" }}>
      <Group justify="space-between" wrap="nowrap" mb={12}>
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            leftSection={<BsFileEarmarkText size={12} />}
            onClick={() => openFile()}
          >
            Open
          </Button>
          <Button
            size="xs"
            variant="subtle"
            leftSection={<BsSave size={12} />}
            onClick={() => saveFile()}
          >
            Save
          </Button>
        </Group>
        {/* View Controls */}
        <SegmentedControl
          value={viewMode}
          onChange={value => setViewMode(value as "editor" | "both" | "preview")}
          data={[
            {
              label: (
                <Group gap={3} justify="center" wrap="nowrap">
                  <BsFileEarmarkText size="0.8rem" />
                  <Text size="xs">Editor</Text>
                </Group>
              ),
              value: "editor",
            },
            {
              label: (
                <Group gap={3} justify="center" wrap="nowrap">
                  <BsLayoutSplit size="0.8rem" />
                  <Text size="xs">Split</Text>
                </Group>
              ),
              value: "both",
            },
            {
              label: (
                <Group gap={3} wrap="nowrap" justify="center">
                  <BsEye size="0.8rem" />
                  <Text size="xs">Preview</Text>
                </Group>
              ),
              value: "preview",
            },
          ]}
        />
        <Group gap="xs">
          <CopyButton value={source}>
            {({ copied, copy }) => (
              <Button
                size="xs"
                variant="subtle"
                leftSection={copied ? <BsCheck size={12} /> : <BsCopy size={12} />}
                onClick={copy}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </CopyButton>
        </Group>
      </Group>
      {/* Editor/Preview Area */}
      <Box style={{ flex: 1, overflow: "hidden", borderRadius: "8px" }}>
        <MarkdownEditor
          file={source}
          setFile={setSource}
          showPreview={viewMode === "both" || viewMode === "preview"}
          showEditor={viewMode === "both" || viewMode === "editor"}
        />
      </Box>
    </Stack>
  );
};

export default Markdown;

// TODO: Save previous text,... db?
