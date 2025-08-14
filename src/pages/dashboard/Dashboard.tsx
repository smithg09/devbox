import AddFeedModal from "@/pages/dashboard/components/AddFeedModal";
import RecentlyUsed from "@/pages/dashboard/components/RecentlyUsed";
import RSSFeed from "@/pages/dashboard/components/RSSFeed";
import { useRecentTools } from "@/pages/dashboard/hooks/useRecentTools";
import { useRssFeeds } from "@/pages/dashboard/hooks/useRssFeeds";
import { ActionIcon, Alert, Button, Group, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { BsGear, BsInfoCircle } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useDailyTip } from "./hooks/useDailyTip";

const MAX_RECENT = 8;

export default function Dashboard() {
  const navigate = useNavigate();

  const { tip, nextTip } = useDailyTip();
  const { recent, clearRecent } = useRecentTools();
  const { feeds, items, addFeed, removeFeed, toggleFeed, refreshAll, loading } = useRssFeeds();

  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    // ensure defaults seeded
  }, []);

  return (
    <Stack gap={16} className="overflow-padding overflow-auto">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Stack gap={2}>
          <Title order={2}>Welcome to DevBox</Title>
          <Text c="dimmed" size="sm">
            Your daily developer hub
          </Text>
        </Stack>
        <ActionIcon variant="light" size="lg" onClick={() => navigate("/settings")}>
          <BsGear />
        </ActionIcon>
      </Group>

      {/* Daily Tip */}
      {tip && (
        <Alert
          variant="light"
          icon={<BsInfoCircle />}
          style={{ overflow: "visible" }}
          styles={{
            root: {
              padding: "var(--mantine-spacing-xs)",
            },
            wrapper: {
              alignItems: "center",
            },
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" c="var(--mantine-color-text)">
              {tip.text}
            </Text>
            <Button variant="subtle" aria-label="next tip" onClick={nextTip} size="xs">
              Next tip <span style={{ marginLeft: 8 }}>→</span>
            </Button>
          </Group>
        </Alert>
      )}

      {/* Recently used tools */}
      <RecentlyUsed recent={recent} onClear={clearRecent} max={MAX_RECENT} />

      {/* RSS Section */}
      <RSSFeed
        feeds={feeds}
        items={items}
        loading={loading}
        onRefresh={refreshAll}
        onToggleFeed={toggleFeed}
        onRemoveFeed={removeFeed}
        onAddRequest={() => setAddOpen(true)}
      />

      <AddFeedModal
        opened={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(url, label) => addFeed(url, label)}
      />
    </Stack>
  );
}
