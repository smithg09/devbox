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

  function handleAdd() {
    const url = feedUrl.trim();
    if (!url) return;
    let label = feedLabel.trim();
    if (!label) label = extractLabel(url) || "";
    onAdd(url, label || undefined);
    setFeedUrl("");
    setFeedLabel("");
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add RSS feed" centered>
      <Stack>
        <TextInput
          label="Feed URL"
          placeholder="https://example.com/feed.xml"
          value={feedUrl}
          onChange={e => setFeedUrl(e.currentTarget.value)}
        />
        <TextInput
          label="Label (optional)"
          placeholder="Friendly name"
          value={feedLabel}
          onChange={e => setFeedLabel(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button onClick={handleAdd}>Add</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
