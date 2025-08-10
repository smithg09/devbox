import { ActionIcon, Checkbox, Group, Table, TextInput, Tooltip } from "@mantine/core";
import { BsPlus, BsTrash3 } from "react-icons/bs";
import { KeyValue } from "../types/rest";

type Props = {
  title: string;
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
};

export default function ParamsHeadersEditor({ title, rows, onChange }: Props) {
  const updateRow = (id: string, patch: Partial<KeyValue>) =>
    onChange(rows.map(r => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () =>
    onChange([...rows, { id: crypto.randomUUID(), key: "", value: "", enabled: true }]);
  const removeRow = (id: string) => onChange(rows.filter(r => r.id !== id));

  return (
    <div>
      <Group justify="space-between" mb="xs">
        <strong>{title}</strong>
        <Tooltip label="Add row">
          <ActionIcon variant="default" mr={2} onClick={addRow}>
            <BsPlus size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Table striped withTableBorder withColumnBorders stickyHeader stickyHeaderOffset={0}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>On</Table.Th>
            <Table.Th>Key</Table.Th>
            <Table.Th>Value</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map(r => (
            <Table.Tr key={r.id}>
              <Table.Td style={{ width: 56 }}>
                <Checkbox
                  checked={r.enabled}
                  onChange={e => updateRow(r.id, { enabled: e.currentTarget.checked })}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  value={r.key}
                  placeholder="Key"
                  onChange={e => updateRow(r.id, { key: e.currentTarget.value })}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  value={r.value}
                  placeholder="Value"
                  onChange={e => updateRow(r.id, { value: e.currentTarget.value })}
                />
              </Table.Td>
              <Table.Td style={{ width: 56 }}>
                <ActionIcon color="red" variant="light" onClick={() => removeRow(r.id)}>
                  <BsTrash3 size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
