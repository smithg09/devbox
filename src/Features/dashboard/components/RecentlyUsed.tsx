import { tools } from "@/constants/tools";
import { type RecentTool } from "@/Features/dashboard/hooks/useRecentTools";
import { Box, Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import classes from "../styles.module.css";

type RecentlyUsedProps = {
  recent: RecentTool[];
  onClear: () => void;
  max?: number;
};

export default function RecentlyUsed({ recent, onClear, max = 8 }: RecentlyUsedProps) {
  const navigate = useNavigate();

  return (
    <Stack mt="xs">
      <Group
        justify="space-between"
        align="center"
        pos="sticky"
        top="-1rem"
        py={12}
        bg="var(--mantine-color-body)"
        style={{ zIndex: 1000 }}
      >
        <Title order={4}>Recently used</Title>
        {recent.length > 0 && (
          <Button size="xs" variant="subtle" onClick={onClear}>
            Clear history
          </Button>
        )}
      </Group>
      {recent.length === 0 ? (
        <Text c="dimmed" size="sm">
          No recent activity yet. Try a tool from the sidebar or search.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="xs">
          {recent.slice(0, max).map(r => {
            const t = tools.find(tt => tt.id === r.id);
            if (!t) return null;
            return (
              <Box
                key={r.id}
                onClick={() => navigate(t.path)}
                p="xs"
                className={classes.recentCard}
              >
                <Group align="flex-start" gap={4}>
                  <Group gap={6} w="100%" align="center" justify="flex-start">
                    <Box className={classes.iconWrapper}>{t.icon}</Box>
                    <Text size="sm" fw={600}>
                      {t.text}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {t.description}
                  </Text>
                </Group>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Stack>
  );
}
