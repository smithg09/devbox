import { Group, Text } from "@mantine/core";
import { useMemo } from "react";
import { BsFileText, BsStopwatch, BsType } from "react-icons/bs";

interface MarkdownStatsProps {
  content: string;
  className?: string;
}

export function MarkdownStats({ content, className }: MarkdownStatsProps) {
  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, "").length;
    const lines = content.split("\n").length;
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim()).length;

    // Reading time calculation (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(words / 200);
    const readingTime = readingTimeMinutes === 1 ? "1 min" : `${readingTimeMinutes} mins`;

    return {
      words,
      characters,
      charactersNoSpaces,
      lines,
      paragraphs,
      readingTime,
    };
  }, [content]);

  return (
    <Group gap="md" className={className}>
      <Group gap="xs">
        <BsFileText size={12} />
        <Text size="xs" c="dimmed">
          {stats.words} words
        </Text>
      </Group>

      <Group gap="xs">
        <BsType size={12} />
        <Text size="xs" c="dimmed">
          {stats.characters} chars
        </Text>
      </Group>

      <Group gap="xs">
        <BsStopwatch size={12} />
        <Text size="xs" c="dimmed">
          {stats.readingTime} read
        </Text>
      </Group>

      <Text size="xs" c="dimmed">
        {stats.lines} lines
      </Text>

      <Text size="xs" c="dimmed">
        {stats.paragraphs} paragraphs
      </Text>
    </Group>
  );
}
