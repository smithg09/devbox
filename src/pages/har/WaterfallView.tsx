import React from "react";
import { Box, Text, Group, Stack, Tooltip, ScrollArea, Paper, ActionIcon } from "@mantine/core";
import { BsZoomIn, BsZoomOut, BsArrowsAngleExpand } from "react-icons/bs";
import { NetworkEntry } from "./types";
import { formatDuration, formatFileSize } from "./utils";

interface WaterfallProps {
  entries: NetworkEntry[];
  selectedEntry: NetworkEntry | null;
  onEntrySelect: (entry: NetworkEntry) => void;
}

interface WaterfallBar {
  entry: NetworkEntry;
  startTime: number;
  phases: Array<{
    name: string;
    duration: number;
    color: string;
    start: number;
  }>;
}

const PHASE_COLORS = {
  blocked: "#9CA3AF",
  dns: "#FCD34D",
  connect: "#F97316",
  ssl: "#A855F7",
  send: "#3B82F6",
  wait: "#10B981",
  receive: "#EF4444",
};

export const WaterfallView: React.FC<WaterfallProps> = ({
  entries,
  selectedEntry,
  onEntrySelect,
}) => {
  const [zoomLevel, setZoomLevel] = React.useState(1);
  // Calculate waterfall data
  const waterfallBars: WaterfallBar[] = React.useMemo(() => {
    if (entries.length === 0) return [];

    // Find the earliest start time
    const earliestStart = Math.min(
      ...entries.map(entry => new Date(entry.startedDateTime).getTime())
    );

    return entries.map(entry => {
      const startTime = new Date(entry.startedDateTime).getTime() - earliestStart;
      const timings = entry.timings;

      let currentOffset = 0;
      const phases: WaterfallBar["phases"] = [];

      // Build phases in order
      const timingPhases = [
        { name: "blocked", duration: timings.blocked || 0, color: PHASE_COLORS.blocked },
        { name: "dns", duration: timings.dns || 0, color: PHASE_COLORS.dns },
        { name: "connect", duration: timings.connect || 0, color: PHASE_COLORS.connect },
        { name: "ssl", duration: timings.ssl || 0, color: PHASE_COLORS.ssl },
        { name: "send", duration: timings.send, color: PHASE_COLORS.send },
        { name: "wait", duration: timings.wait, color: PHASE_COLORS.wait },
        { name: "receive", duration: timings.receive, color: PHASE_COLORS.receive },
      ];

      timingPhases.forEach(phase => {
        if (phase.duration > 0) {
          phases.push({
            ...phase,
            start: currentOffset,
          });
          currentOffset += phase.duration;
        }
      });

      return {
        entry,
        startTime,
        phases,
      };
    });
  }, [entries]);

  // Calculate the total timeline width (without zoom factor)
  const baseTotalDuration = React.useMemo(() => {
    if (waterfallBars.length === 0) return 0;

    return Math.max(...waterfallBars.map(bar => bar.startTime + bar.entry.duration));
  }, [waterfallBars]);

  const formatUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;

    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      if (path.length <= maxLength - urlObj.hostname.length - 3) {
        return `${urlObj.hostname}${path}`;
      }
      return `${urlObj.hostname}...${path.slice(-(maxLength - urlObj.hostname.length - 6))}`;
    } catch {
      return url.length > maxLength ? `${url.slice(0, maxLength - 3)}...` : url;
    }
  };

  const getBarWidth = (duration: number) => {
    if (baseTotalDuration === 0) return 0;
    // Use a base width of 600px and scale with zoom
    const baseWidth = 600;
    return Math.max((duration / baseTotalDuration) * baseWidth * zoomLevel, 1);
  };

  const getBarOffset = (startTime: number) => {
    if (baseTotalDuration === 0) return 0;
    // Use the same base width for consistent scaling
    const baseWidth = 600;
    return (startTime / baseTotalDuration) * baseWidth * zoomLevel;
  };

  if (entries.length === 0) {
    return (
      <Box ta="center" py="xl">
        <Text c="dimmed">No requests to display in waterfall view</Text>
      </Box>
    );
  }

  return (
    <Box>
      <ScrollArea style={{ height: "calc(100vh - 400px)" }} type="auto">
        {/* Timeline header */}
        <Box p="sm" mb="md">
          <Group justify="space-between">
            <Text fw={500}>Waterfall View</Text>
            <Group gap="md">
              <Group gap="xs">
                <ActionIcon
                  variant="light"
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.5))}
                  disabled={zoomLevel <= 0.5}
                >
                  <BsZoomOut size={16} />
                </ActionIcon>
                <Text size="sm" style={{ minWidth: 40, textAlign: "center" }}>
                  {zoomLevel}x
                </Text>
                <ActionIcon
                  variant="light"
                  onClick={() => setZoomLevel(Math.min(5, zoomLevel + 0.5))}
                  disabled={zoomLevel >= 5}
                >
                  <BsZoomIn size={16} />
                </ActionIcon>
                <ActionIcon variant="light" onClick={() => setZoomLevel(1)}>
                  <BsArrowsAngleExpand size={16} />
                </ActionIcon>
              </Group>
              <Text size="sm" c="dimmed">
                Total Duration: {formatDuration(baseTotalDuration)}
              </Text>
            </Group>
          </Group>

          {/* Timeline scale */}
          <Box mt="md" style={{ position: "relative", height: 20, marginLeft: 216 }}>
            <Box
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${600 * zoomLevel}px`,
                height: 1,
                backgroundColor: "var(--mantine-color-gray-4)",
              }}
            />
            {/* Time markers */}
            {[0, 0.25, 0.5, 0.75, 1].map(fraction => (
              <Box
                key={fraction}
                style={{
                  position: "absolute",
                  left: `${fraction * 600 * zoomLevel}px`,
                  top: 0,
                  height: 10,
                  width: 1,
                  backgroundColor: "var(--mantine-color-gray-4)",
                }}
              />
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map(fraction => (
              <Text
                key={fraction}
                size="xs"
                c="dimmed"
                style={{
                  position: "absolute",
                  left: `${fraction * 600 * zoomLevel}px`,
                  top: 12,
                  transform: "translateX(-50%)",
                }}
              >
                {formatDuration(baseTotalDuration * fraction)}
              </Text>
            ))}
          </Box>
        </Box>
        <Box style={{ minWidth: `${600 * zoomLevel + 300}px` }}>
          <Stack gap={2}>
            {waterfallBars.map(bar => (
              <Paper
                key={bar.entry.id}
                p="xs"
                withBorder={selectedEntry?.id === bar.entry.id}
                style={{
                  cursor: "pointer",
                  backgroundColor:
                    selectedEntry?.id === bar.entry.id
                      ? "var(--mantine-color-blue-light)"
                      : undefined,
                }}
                onClick={() => onEntrySelect(bar.entry)}
              >
                <Group gap="md" wrap="nowrap">
                  {/* Request info */}
                  <Box style={{ minWidth: 200, maxWidth: 200 }}>
                    <Tooltip label={bar.entry.request.url} position="top" withArrow>
                      <Text size="sm" truncate style={{ fontFamily: "monospace" }}>
                        {formatUrl(bar.entry.request.url)}
                      </Text>
                    </Tooltip>
                    <Group gap="xs" mt={2}>
                      <Text size="xs" c="dimmed">
                        {bar.entry.request.method}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {bar.entry.response.status}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatFileSize(bar.entry.size)}
                      </Text>
                    </Group>
                  </Box>

                  {/* Waterfall bar */}
                  <Box
                    style={{
                      width: `${600 * zoomLevel}px`,
                      position: "relative",
                      height: 20,
                      backgroundColor: "var(--mantine-color-gray-1)",
                      border: "1px solid var(--mantine-color-gray-3)",
                    }}
                  >
                    <Box
                      style={{
                        position: "absolute",
                        left: `${getBarOffset(bar.startTime)}px`,
                        width: `${getBarWidth(bar.entry.duration)}px`,
                        height: "100%",
                        display: "flex",
                      }}
                    >
                      {bar.phases.map((phase, phaseIndex) => (
                        <Tooltip
                          key={phaseIndex}
                          label={`${phase.name}: ${formatDuration(phase.duration)}`}
                          position="top"
                          withArrow
                        >
                          <Box
                            style={{
                              backgroundColor: phase.color,
                              width: `${(phase.duration / bar.entry.duration) * 100}%`,
                              height: "100%",
                              border: "1px solid rgba(255,255,255,0.2)",
                              borderLeft: phaseIndex === 0 ? undefined : "none",
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>

                  {/* Duration */}
                  <Box style={{ minWidth: 80, textAlign: "right" }}>
                    <Text size="sm" style={{ fontFamily: "monospace" }}>
                      {formatDuration(bar.entry.duration)}
                    </Text>
                  </Box>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Box>
      </ScrollArea>

      {/* Legend */}
      <Paper p="sm" mt="md" withBorder>
        <Text size="sm" fw={500} mb="xs">
          Timing Phases:
        </Text>
        <Group gap="md">
          {Object.entries(PHASE_COLORS).map(([phase, color]) => (
            <Group key={phase} gap={4}>
              <Box
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: color,
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              />
              <Text size="xs" style={{ textTransform: "capitalize" }}>
                {phase}
              </Text>
            </Group>
          ))}
        </Group>
      </Paper>
    </Box>
  );
};
