import { ActionIcon, Group, Tabs, Text } from "@mantine/core";
import { BsPlus, BsX } from "react-icons/bs";
import { TbLayoutColumns, TbLayoutRows } from "react-icons/tb";
import { RequestTab } from "../types/rest";

type Props = {
  tabs: RequestTab[];
  activeId: string;
  onChange: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onDuplicate: (id: string) => void;
  layout: "vertical" | "two-column";
  onToggleLayout: () => void;
};

export function TabStrip({
  tabs,
  activeId,
  onChange,
  onAdd,
  onClose,
  layout,
  onToggleLayout,
}: Props) {
  return (
    <Group justify="space-between" gap="xs" display="flex" style={{ width: "100%" }}>
      <Tabs value={activeId} onChange={v => v && onChange(v)} variant="default" flex={1}>
        <Tabs.List>
          {tabs.map(t => (
            <Tabs.Tab key={t.id} value={t.id} leftSection={<Text size="xs">{t.method}</Text>}>
              <Group gap={6} align="center">
                <Text size="sm" truncate style={{ maxWidth: 180 }}>
                  {t.title}
                </Text>
                <ActionIcon
                  size="xs"
                  color="red"
                  variant="subtle"
                  onClick={e => (e.stopPropagation(), onClose(t.id))}
                >
                  <BsX size={16} />
                </ActionIcon>
              </Group>
            </Tabs.Tab>
          ))}
          <ActionIcon
            size="sm"
            ml="xs"
            variant="light"
            onClick={onAdd}
            styles={{
              root: {
                alignSelf: "center",
              },
            }}
          >
            <BsPlus size={24} />
          </ActionIcon>
        </Tabs.List>
      </Tabs>
      <ActionIcon title="Toggle Layout" variant="subtle" onClick={onToggleLayout}>
        {layout === "two-column" ? <TbLayoutRows size={20} /> : <TbLayoutColumns size={20} />}
      </ActionIcon>
    </Group>
  );
}

export default TabStrip;
