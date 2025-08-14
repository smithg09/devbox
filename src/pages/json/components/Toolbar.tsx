import { ActionIcon, Button, Group, NumberInput, Switch, Text, Tooltip } from "@mantine/core";
import { BsArrowsExpand, BsBraces, BsCodeSlash, BsScissors } from "react-icons/bs";

type Props = {
  autoFormat: boolean;
  setAutoFormat: (v: boolean) => void;
  onFormat: () => void;
  onMinify: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  collapsedDepth: number | boolean;
  setCollapsedDepth: (v: number) => void;
};

export function Toolbar({
  autoFormat,
  setAutoFormat,
  onFormat,
  onMinify,
  onExpandAll,
  onCollapseAll,
  collapsedDepth,
  setCollapsedDepth,
}: Props) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="xs" wrap="nowrap">
        <Button
          size="xs"
          variant="light"
          leftSection={<BsCodeSlash size={12} />}
          onClick={onFormat}
        >
          Format
        </Button>
        <Button size="xs" variant="light" leftSection={<BsScissors size={12} />} onClick={onMinify}>
          Minify
        </Button>
        <Switch
          size="xs"
          checked={autoFormat}
          onChange={e => setAutoFormat(e.currentTarget.checked)}
          label="Auto-format on paste"
        />
      </Group>
      <Group gap="xs" wrap="nowrap">
        <Group gap={6} wrap="nowrap">
          <Text size="xs" c="dimmed">
            Depth
          </Text>
          <NumberInput
            size="xs"
            min={0}
            max={8}
            value={typeof collapsedDepth === "number" ? collapsedDepth : 0}
            onChange={val =>
              setCollapsedDepth(typeof val === "number" && !Number.isNaN(val) ? val : 0)
            }
            w={50}
          />
          <Tooltip label="Expand all">
            <ActionIcon size="md" variant="subtle" onClick={onExpandAll}>
              <BsArrowsExpand size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Collapse all">
            <ActionIcon size="md" variant="subtle" onClick={onCollapseAll}>
              <BsBraces size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Group>
  );
}
