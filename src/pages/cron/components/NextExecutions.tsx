import { Text, Group, Stack } from "@mantine/core";
import { CronExecution } from "../types/cron.types";

interface NextExecutionsProps {
  executions: CronExecution[];
  complexity?: "simple" | "moderate" | "complex";
}

export default function NextExecutions({ executions }: NextExecutionsProps) {
  return (
    <Stack w={"35%"} style={{ alignSelf: "flex-start" }} gap="md">
      <Text fw={600} size="sm">
        Next Executions
      </Text>
      {executions.length === 0 ? (
        <Text size="sm" c="dimmed">
          No valid executions found
        </Text>
      ) : (
        <Stack gap="xs">
          {executions.map(execution => (
            <Group justify="space-between" key={execution.humanReadable}>
              <div>
                <Text size="xs" style={{ fontFamily: "monospace" }}>
                  {execution.humanReadable} (
                  <Text component="span" size="xs" c="dimmed">
                    {execution.fromNow}
                  </Text>
                  )
                </Text>
              </div>
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
