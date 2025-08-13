import { tools } from "@/constants/tools";
import { Box, Checkbox, Group, Stack, Switch, Table, Text, TextInput, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { useEffect, useState } from "react";

export interface SidebarConfig {
  showDescription: boolean;
  showModules: boolean;
  hiddenTools: string[];
}

export default function Settings() {
  const [sidebarConfig, setSidebarConfig] = useLocalStorage<SidebarConfig>({
    key: "sidebarConfig",
    defaultValue: {
      showDescription: true,
      showModules: true,
      hiddenTools: [],
    },
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    console.log("Registered Tools", tools);
  }, []);

  const handleToggle = async (checked: boolean) => {
    const newConfig = { ...sidebarConfig, showDescription: checked };
    setSidebarConfig(newConfig);
  };

  const handleToggleModules = async (checked: boolean) => {
    const newConfig = { ...sidebarConfig, showModules: checked };
    setSidebarConfig(newConfig);
  };

  const handleToolVisibility = async (toolId: string, checked: boolean) => {
    let updatedHidden: string[];
    if (!checked) {
      updatedHidden = [...sidebarConfig.hiddenTools, toolId];
    } else {
      updatedHidden = sidebarConfig.hiddenTools.filter(id => id !== toolId);
    }
    setSidebarConfig({ ...sidebarConfig, hiddenTools: updatedHidden });
  };

  // Filter tools by search
  const filteredTools = tools.filter(tool => {
    const q = search.toLowerCase();
    return (
      tool.text.toLowerCase().includes(q) ||
      (tool.description && tool.description.toLowerCase().includes(q))
    );
  });

  return (
    <Box p="md" h="100%" style={{ overflow: "auto" }}>
      <Title order={2} mb="md">
        Settings
      </Title>
      <Stack gap="md">
        <Switch
          label="Show sidebar descriptions"
          checked={!!sidebarConfig.showDescription}
          onChange={e => handleToggle(e.currentTarget.checked)}
        />
        <Switch
          label="Group tools by module"
          checked={!!sidebarConfig.showModules}
          onChange={e => handleToggleModules(e.currentTarget.checked)}
        />

        {/* Manage Tools */}
        <Stack gap="xs" mt="md">
          <Title order={4}>Manage Tools</Title>
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              Select the tools you want to use
            </Text>
            <TextInput
              placeholder="Search tools..."
              value={search}
              onChange={e => setSearch(e.currentTarget.value)}
              mb="sm"
              size="xs"
            />
          </Group>
          <Table
            highlightOnHover
            withTableBorder
            withColumnBorders
            striped
            verticalSpacing={5}
            stickyHeader
            stickyHeaderOffset={-18}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 240 }}>Tool</Table.Th>
                <Table.Th>Description</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTools.map(tool => (
                <Table.Tr key={tool.id}>
                  <Table.Td display="flex" align="center">
                    <Checkbox
                      radius="sm"
                      checked={!sidebarConfig.hiddenTools.includes(tool.id)}
                      onChange={e => handleToolVisibility(tool.id, e.currentTarget.checked)}
                      size="xs"
                      aria-label={`Show/hide ${tool.text}`}
                      mr={8}
                    />
                    <Text size="sm" fw={500} lh={1.2}>
                      {tool.text}
                    </Text>
                  </Table.Td>
                  <Table.Td>{tool.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Stack>
    </Box>
  );
}
