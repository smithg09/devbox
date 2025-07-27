import {
  Stack,
  Text,
  Group,
  Badge,
  Code,
  ScrollArea,
  Card,
  Tabs,
  ActionIcon,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import { BsLink, BsCalendar, BsCopy, BsCheck } from "react-icons/bs";
import { patternLibrary } from "./constants";
import { RegexFlags } from "./types";
import classes from "./RegexAdvanced.module.css";

interface PatternLibraryProps {
  onPatternSelect: (pattern: string, flags: Partial<RegexFlags>) => void;
}

export const PatternLibrary = ({ onPatternSelect }: PatternLibraryProps) => {
  const urlPatterns = patternLibrary.filter(p => p.category === "url");
  const datePatterns = patternLibrary.filter(p => p.category === "date");

  const handlePatternClick = (pattern: (typeof patternLibrary)[0]) => {
    onPatternSelect(pattern.pattern, pattern.flags);
  };

  const renderPatternCard = (pattern: (typeof patternLibrary)[0]) => (
    <Card
      key={pattern.id}
      p="sm"
      withBorder
      className={classes.patternLibraryItem}
      onClick={() => handlePatternClick(pattern)}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            {pattern.name}
          </Text>
          <Group gap="xs">
            <Badge variant="light" size="xs">
              {pattern.category}
            </Badge>
            <CopyButton value={pattern.pattern}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? "Copied!" : "Copy regex"}>
                  <ActionIcon
                    color={copied ? "teal" : "gray"}
                    variant="subtle"
                    size="xs"
                    onClick={e => {
                      e.stopPropagation();
                      copy();
                    }}
                  >
                    {copied ? <BsCheck size={12} /> : <BsCopy size={12} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Group>

        <Code c="gray" fz="xs" style={{ wordBreak: "break-all" }}>
          {pattern.pattern}
        </Code>

        <Text size="xs" c="dimmed">
          {pattern.description}
        </Text>

        {pattern.examples.length > 0 && (
          <div>
            <Text size="xs" fw={500} mb={4}>
              Examples:
            </Text>
            <Stack gap={2}>
              {pattern.examples.slice(0, 2).map((example, index) => (
                <Code key={index} c="green" fz="xs">
                  {example}
                </Code>
              ))}
            </Stack>
          </div>
        )}

        <Group gap="xs" mt="xs">
          {Object.entries(pattern.flags).map(
            ([flag, enabled]) =>
              enabled && (
                <Badge key={flag} variant="dot" size="xs">
                  {flag.charAt(0)}
                </Badge>
              )
          )}
        </Group>
      </Stack>
    </Card>
  );

  return (
    <Stack gap="md">
      <Tabs defaultValue="url">
        <Tabs.List>
          <Tabs.Tab value="url" leftSection={<BsLink size={14} />}>
            URLs
          </Tabs.Tab>
          <Tabs.Tab value="date" leftSection={<BsCalendar size={14} />}>
            Dates
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="url" pt="md">
          <ScrollArea h={400}>
            <Stack gap="sm">{urlPatterns.map(renderPatternCard)}</Stack>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="date" pt="md">
          <ScrollArea h={400}>
            <Stack gap="sm">{datePatterns.map(renderPatternCard)}</Stack>
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
