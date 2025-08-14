import { Text, TextInput, Group, Button, Alert, Stack, Title } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { BsCopy, BsCheck, BsShuffle, BsExclamationCircle } from "react-icons/bs";
import { useCronParser } from "../hooks/useCronParser";
import { generateRandomCron } from "../utils/cronHelpers";

interface CronBuilderProps {
  cronExpression: string;
  onCronChange: (expression: string) => void;
}

export default function CronBuilder({ cronExpression, onCronChange }: CronBuilderProps) {
  const clipboard = useClipboard();
  const { validation, meaning } = useCronParser(cronExpression);

  const handleCopy = () => {
    clipboard.copy(cronExpression);
  };

  const handleRandomize = () => {
    onCronChange(generateRandomCron());
  };

  return (
    <Stack gap="lg">
      <Title
        order={2}
        fw={600}
        c={validation.isValid ? "" : "red.7"}
        mb={32}
        p={"md"}
        pb={0}
        ta="center"
        ff="monospace"
      >
        <q>{meaning}</q>
      </Title>

      <Stack gap="md">
        {/* Title and Controls */}
        <Group justify="space-between">
          <Text fw={600} size="md">
            Cron Expression Builder
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant="subtle"
              onClick={handleRandomize}
              leftSection={<BsShuffle size={12} />}
            >
              Random
            </Button>
            <Button
              size="xs"
              variant="subtle"
              onClick={handleCopy}
              leftSection={clipboard.copied ? <BsCheck size={12} /> : <BsCopy size={12} />}
            >
              {clipboard.copied ? "Copied" : "Copy"}
            </Button>
          </Group>
        </Group>

        {/* Cron Expression Input */}
        <TextInput
          value={cronExpression}
          onChange={e => onCronChange(e.currentTarget.value)}
          placeholder="* * * * *"
          size="xl"
          styles={{
            input: {
              fontFamily: "monospace",
              fontSize: "2rem",
              textAlign: "center",
              fontWeight: 600,
              padding: "1rem",
              height: "4rem",
            },
          }}
          error={!validation.isValid}
        />

        {/* Validation Error */}
        {!validation.isValid && (
          <Alert icon={<BsExclamationCircle size={16} />} color="red" variant="light">
            <Text size="sm">{validation.error}</Text>
            {validation.details && (
              <Text size="xs" c="dimmed">
                {validation.details}
              </Text>
            )}
          </Alert>
        )}
      </Stack>
    </Stack>
  );
}
