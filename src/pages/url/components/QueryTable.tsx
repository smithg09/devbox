import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { BsPlus, BsTrash } from "react-icons/bs";

export type QueryItem = { id: string; enabled: boolean; key: string; value: string };

export default function QueryTable({
  items,
  onChange,
}: {
  items: QueryItem[];
  onChange: (items: QueryItem[]) => void;
}) {
  const update = (id: string, patch: Partial<QueryItem>) => {
    onChange(items.map(it => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => onChange(items.filter(it => it.id !== id));
  const add = () =>
    onChange([...items, { id: crypto.randomUUID(), enabled: true, key: "", value: "" }]);

  return (
    <Stack mt="sm">
      <Group justify="space-between">
        <Text fw={600}>Query</Text>
        <Button size="xs" leftSection={<BsPlus />} variant="default" onClick={add}>
          Add
        </Button>
      </Group>
      <Table verticalSpacing={2} horizontalSpacing={6} withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={50}></Table.Th>
            <Table.Th>Key</Table.Th>
            <Table.Th>Value</Table.Th>
            <Table.Th w={50}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map(row => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <Checkbox
                  size="xs"
                  checked={row.enabled}
                  onChange={e => update(row.id, { enabled: e.currentTarget.checked })}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="xs"
                  value={row.key}
                  onChange={e => update(row.id, { key: e.currentTarget.value })}
                  placeholder="key"
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="xs"
                  value={row.value}
                  onChange={e => update(row.id, { value: e.currentTarget.value })}
                  placeholder="value"
                />
              </Table.Td>
              <Table.Td>
                <Tooltip label="Remove">
                  <ActionIcon variant="subtle" color="red" onClick={() => remove(row.id)}>
                    <BsTrash />
                  </ActionIcon>
                </Tooltip>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
