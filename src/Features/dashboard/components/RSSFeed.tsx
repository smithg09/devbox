import FeedItem, { type RssItem } from "@/Features/dashboard/components/FeedItem";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { BsArrowClockwise, BsPlus } from "react-icons/bs";

type Feed = { id: string; url: string; title?: string; enabled: boolean };

type RSSFeedProps = {
  feeds: Feed[];
  items: RssItem[];
  loading: boolean;
  onRefresh: (force?: boolean) => void;
  onToggleFeed: (id: string) => void;
  onRemoveFeed: (id: string) => void;
  onAddRequest: () => void;
};

export default function RSSFeed({
  feeds,
  items,
  loading,
  onRefresh,
  onToggleFeed,
  onRemoveFeed,
  onAddRequest,
}: RSSFeedProps) {
  const [visibleCount, setVisibleCount] = useState(30);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const infiniteItems = items.slice(0, Math.min(visibleCount, items.length));

  return (
    <Stack mt="xl">
      <Stack
        pos="sticky"
        top="-1rem"
        py={12}
        bg="var(--mantine-color-body)"
        style={{ zIndex: 1000 }}
      >
        <Group justify="space-between" align="center">
          <Title order={4}>Developer news</Title>
          <Group gap={4}>
            <SegmentedControl
              size="xs"
              value={viewMode}
              onChange={v => setViewMode(v as any)}
              data={[
                { label: "Card", value: "card" },
                { label: "List", value: "list" },
              ]}
            />
            <Button
              size="xs"
              variant="subtle"
              leftSection={<BsArrowClockwise />}
              loading={loading}
              onClick={() => onRefresh(true)}
            >
              Refresh feeds
            </Button>
            <Button size="xs" leftSection={<BsPlus />} variant="light" onClick={onAddRequest}>
              Add feed
            </Button>
          </Group>
        </Group>

        <Group gap="xs">
          {feeds.map(f => (
            <Badge
              key={f.id}
              size="sm"
              opacity={f.enabled ? 1 : 0.8}
              variant={f.enabled ? "filled" : "light"}
              onClick={() => onToggleFeed(f.id)}
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  styles={{
                    icon: {
                      lineHeight: "12px",
                      color: "var(--mantine-color-gray-5)",
                    },
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    onRemoveFeed(f.id);
                  }}
                >
                  ×
                </ActionIcon>
              }
              style={{ cursor: "pointer" }}
            >
              {f.title || f.url}
            </Badge>
          ))}
        </Group>
      </Stack>

      <Stack>
        {items.length === 0 ? (
          <Text c="dimmed" size="sm">
            No items yet. Try refreshing.
          </Text>
        ) : (
          <>
            {viewMode === "card" ? (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                {infiniteItems.map(item => (
                  <FeedItem key={item.link} item={item} variant="card" />
                ))}
              </SimpleGrid>
            ) : (
              <Stack gap={6}>
                {infiniteItems.map(item => (
                  <FeedItem key={item.link} item={item} variant="list" />
                ))}
              </Stack>
            )}
          </>
        )}
        {visibleCount < items.length && (
          <Group justify="center" mt="xs">
            <Button size="xs" variant="light" onClick={() => setVisibleCount(c => c + 24)}>
              Load more
            </Button>
          </Group>
        )}
      </Stack>
    </Stack>
  );
}
