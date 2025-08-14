import FeedItem, { type RssItem } from "@/pages/dashboard/components/FeedItem";
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
          <Group gap={8}>
            <Button
              size="xs"
              variant="subtle"
              leftSection={<BsArrowClockwise />}
              loading={loading}
              onClick={() => onRefresh(true)}
            >
              Refresh feeds
            </Button>
            <Button size="xs" leftSection={<BsPlus />} variant="subtle" onClick={onAddRequest}>
              Add feed
            </Button>
            <SegmentedControl
              size="xs"
              value={viewMode}
              onChange={v => setViewMode(v as any)}
              data={[
                { label: "Card", value: "card" },
                { label: "List", value: "list" },
              ]}
            />
          </Group>
        </Group>

        <Group gap="xs">
          {feeds.map(f => (
            <Badge
              key={f.id}
              size="sm"
              bg={f.enabled ? "var(--mantine-color-dark-6)" : "var(--mantine-color-dark-7)"}
              color={f.enabled ? "var(--mantine-color-gray-3)" : "var(--mantine-color-gray-5)"}
              opacity={f.enabled ? 0.8 : 0.5}
              variant="outline"
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
              style={{
                cursor: "pointer",
                border: `1px solid ${f.enabled ? "var(--mantine-color-dark-4)" : "var(--mantine-color-dark-5)"}`,
              }}
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
