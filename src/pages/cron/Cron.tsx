import { Stack, Group } from "@mantine/core";
import { useState } from "react";
import CronBuilder from "./components/CronBuilder";
import CronFieldBreakdown from "./components/CronFieldBreakdown";
import NextExecutions from "./components/NextExecutions";
import CronReference from "./components/CronReference";
import { useCronParser } from "./hooks/useCronParser";

export default function Cron() {
  const [cronExpression, setCronExpression] = useState<string>("1 2/3 * * mon");
  const { nextExecutions, complexity } = useCronParser(cronExpression);
  return (
    <Stack className="overflow-padding" gap="lg" h="100%" style={{ overflow: "scroll" }}>
      {/* Main Cron Builder */}
      <CronBuilder cronExpression={cronExpression} onCronChange={setCronExpression} />

      {/* Field Breakdown */}
      <Group justify="space-between" mb="md" align="center">
        <CronFieldBreakdown cronExpression={cronExpression} />
        <NextExecutions executions={nextExecutions} complexity={complexity} />
      </Group>

      <CronReference />
    </Stack>
  );
}
