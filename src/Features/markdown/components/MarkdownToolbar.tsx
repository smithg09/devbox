import { Button, Group, SegmentedControl } from "@mantine/core";
import { BsFolder2Open, BsDownload } from "react-icons/bs";
import { MarkdownStats } from "./MarkdownStats";

interface MarkdownToolbarProps {
  showPreview: boolean;
  onTogglePreview: () => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  content: string;
  className?: string;
}

export function MarkdownToolbar({
  showPreview,
  onTogglePreview,
  onOpenFile,
  onSaveFile,
  content,
  className,
}: MarkdownToolbarProps) {
  return (
    <Group justify="space-between" className={className}>
      <Group>
        <Button
          variant="light"
          size="sm"
          leftSection={<BsFolder2Open size={14} />}
          onClick={onOpenFile}
        >
          Open
        </Button>

        <Button
          variant="light"
          size="sm"
          leftSection={<BsDownload size={14} />}
          onClick={onSaveFile}
        >
          Save
        </Button>

        <SegmentedControl
          size="sm"
          value={showPreview ? "preview" : "editor"}
          onChange={() => onTogglePreview()}
          data={[
            { label: "Editor", value: "editor" },
            { label: "Preview", value: "preview" },
            { label: "Both", value: "both" },
          ]}
        />
      </Group>

      <Group>
        <MarkdownStats content={content} />
      </Group>
    </Group>
  );
}
