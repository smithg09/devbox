import { Text, Group, Stack, Badge } from "@mantine/core";

interface CronFieldBreakdownProps {
  cronExpression: string;
}

export default function CronFieldBreakdown({ cronExpression }: CronFieldBreakdownProps) {
  const fields = cronExpression.split(" ");
  const fieldLabels = ["minute", "hour", "day", "month", "weekday"];
  const fieldDescriptions = ["0-59", "0-23", "1-31", "1-12", "0-6 (Sun-Sat)"];

  return (
    <Stack w={"60%"} justify="center" align="center">
      <Text fw={600} size="sm">
        Field Breakdown
      </Text>
      <Group gap="xs" justify="center">
        {fields.map((field, index) => (
          <Stack key={index} gap="xs" align="center">
            <Badge
              variant="light"
              color="blue"
              size="md"
              miw={50}
              style={{ gridTemplateColumns: "auto" }}
            >
              {field}
            </Badge>
            <Text size="xs" fw={500} ta="center">
              {fieldLabels[index]}
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              {fieldDescriptions[index]}
            </Text>
          </Stack>
        ))}
      </Group>
    </Stack>
  );
}
