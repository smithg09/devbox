import { Stack, Text, Group, Anchor, Code, Divider } from "@mantine/core";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { regexCheatSheet } from "./constants";

export const CheatSheet = () => {
  return (
    <Stack gap="md">
      <Anchor href={regexCheatSheet.githubLink} target="_blank" size="sm" c="dimmed">
        <Group gap="xs">
          <Text size="xs">Full Reference</Text>
          <BsBoxArrowUpRight size={12} />
        </Group>
      </Anchor>

      <Stack gap="lg">
        {regexCheatSheet.sections.map(section => (
          <div key={section.title}>
            <Text size="xs" fw={600} mb="sm">
              {section.title}
            </Text>
            <Stack gap="xs">
              {section.items.map((item, index) => (
                <Group key={index} justify="space-between" align="flex-start">
                  <Code c="gray" fz="sm">
                    {item.pattern}
                  </Code>
                  <Text size="xs" c="dimmed" style={{ flex: 1, textAlign: "right" }}>
                    {item.description}
                  </Text>
                </Group>
              ))}
            </Stack>
            <Divider my="md" />
          </div>
        ))}
      </Stack>
    </Stack>
  );
};
