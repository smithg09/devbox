import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useState } from "react";

type AddFeedModalProps = {
  opened: boolean;
  onClose: () => void;
  onAdd: (url: string, label?: string) => void;
};

export default function AddFeedModal({ opened, onClose, onAdd }: AddFeedModalProps) {
  const [feedUrl, setFeedUrl] = useState("");
  const [feedLabel, setFeedLabel] = useState("");
  const [feedUrlError, setFeedUrlError] = useState<string | null>(null);

  function extractLabel(url: string): string | undefined {
    try {
      const u = new URL(url);
      const path = u.pathname.split("/").filter(Boolean);
      const last = path[path.length - 1] || u.hostname;
      return last.replace(/\.(rss|xml|atom)$/i, "");
    } catch (_) {
      return undefined;
    }
  }

  function validateFeedUrl(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Feed URL is required";
    try {
      const u = new URL(trimmed);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return "Only http(s) URLs are supported";
      }
      const pathPlusQuery = `${u.pathname}${u.search}`.toLowerCase();
      const looksLikeFeed =
        /\.(xml|rss|atom)(?:$|[?#])/i.test(pathPlusQuery) || /(feed|rss|atom)/i.test(pathPlusQuery);
      if (!looksLikeFeed) {
        return "URL does not look like an RSS/Atom XML feed";
      }
      return null;
    } catch (_err) {
      return "Enter a valid URL";
    }
  }

  function handleAdd() {
    const url = feedUrl.trim();
    const validationError = validateFeedUrl(url);
    setFeedUrlError(validationError);
    if (validationError) return;
    let label = feedLabel.trim();
    if (!label) label = extractLabel(url) || "";
    onAdd(url, label || undefined);
    setFeedUrl("");
    setFeedLabel("");
    setFeedUrlError(null);
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add RSS feed" centered>
      <Stack>
        <TextInput
          label="Feed URL"
          placeholder="https://example.com/feed.xml"
          value={feedUrl}
          onChange={e => {
            const v = e.currentTarget.value;
            setFeedUrl(v);
            setFeedUrlError(v ? validateFeedUrl(v) : "Feed URL is required");
          }}
          error={feedUrlError || undefined}
        />
        <TextInput
          label="Label (optional)"
          placeholder="Friendly name"
          value={feedLabel}
          onChange={e => setFeedLabel(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button onClick={handleAdd} disabled={!!feedUrlError || !feedUrl.trim()}>
            Add
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
