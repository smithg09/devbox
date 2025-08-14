import { getInitials, stringToColor } from "@/utils/avatar";
import { openExternal } from "@/utils/openExternal";
import { Anchor, Box, Group, Paper, Stack, Text } from "@mantine/core";
import classes from "../styles.module.css";

export type RssItem = {
  title: string;
  link: string;
  published: string;
  publishedRelative: string;
  source: string;
  description?: string;
  sourceIconUrl?: string;
  previewImageUrl?: string;
};

type FeedItemProps = {
  item: RssItem;
  variant: "card" | "list";
};

function SourceIcon({ item }: { item: RssItem }) {
  const fallbackKey = item.source || item.title || "";
  return (
    <Box className={classes.sourceIconContainer}>
      {item.sourceIconUrl ? (
        <img
          src={item.sourceIconUrl}
          alt={item.source}
          className={classes.sourceIconImg}
          width={24}
          height={24}
          loading="lazy"
        />
      ) : item.previewImageUrl ? (
        <img
          src={item.previewImageUrl}
          alt={item.source}
          className={classes.sourcePreviewImg}
          width={24}
          height={24}
          loading="lazy"
        />
      ) : (
        <Box className={classes.avatar} style={{ background: stringToColor(fallbackKey) }}>
          {getInitials(fallbackKey)}
        </Box>
      )}
    </Box>
  );
}

export function FeedItem({ item, variant }: FeedItemProps) {
  if (variant === "card") {
    return (
      <Paper withBorder key={item.link} p="sm">
        <Group align="flex-start" gap={8} wrap="nowrap">
          <SourceIcon item={item} />
          <Stack gap={4} flex={1}>
            <Anchor
              component="button"
              className={classes.feedTitle}
              onClick={() => openExternal(item.link)}
              ta="left"
              fw={600}
              size="sm"
            >
              {item.title}
            </Anchor>
            <Text size="xs" c="dimmed">
              {item.source} · {item.publishedRelative}
            </Text>
          </Stack>
        </Group>
      </Paper>
    );
  }

  return (
    <Group
      key={item.link}
      className={classes.feedListRow}
      justify="space-between"
      wrap="nowrap"
      onClick={() => openExternal(item.link)}
    >
      <Group gap={8} wrap="nowrap">
        <SourceIcon item={item} />
        <Stack gap={2}>
          <Text fw={600} size="sm" className={classes.feedTitle}>
            {item.title}
          </Text>
          <Text size="xs" c="dimmed">
            {item.source} · {item.publishedRelative}
          </Text>
        </Stack>
      </Group>
    </Group>
  );
}

export default FeedItem;
