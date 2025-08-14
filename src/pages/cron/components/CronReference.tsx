import { Text, Stack, Table } from "@mantine/core";
import { CRON_EXAMPLES } from "../utils/constants";

export default function CronReference() {
  return (
    <Stack gap="lg" justify="center" align="center" w="100%" my={24}>
      {/* Common Examples */}
      <div>
        <Text size="md" fw={700} mb="sm">
          Common Examples
        </Text>
        <Stack gap="xs" mt={12}>
          <Table
            horizontalSpacing="xl"
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders
            ta="center"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cron expression</Table.Th>
                <Table.Th ta="center">Schedule</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {CRON_EXAMPLES.map(example => (
                <Table.Tr key={example.description}>
                  <Table.Td>{example.expression}</Table.Td>
                  <Table.Td>{example.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </div>
    </Stack>
  );
}
