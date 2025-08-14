import React from "react";
import {
  Box,
  Paper,
  Text,
  Group,
  Badge,
  ScrollArea,
  ActionIcon,
  Switch,
  Alert,
  Stack,
} from "@mantine/core";
import { BsZoomIn, BsZoomOut, BsArrowsAngleExpand, BsExclamationTriangle } from "react-icons/bs";
import { NetworkEntry, PerformanceMilestone, CriticalPath } from "./types";
import { formatDuration, getResourceType, getDomainFromUrl } from "./utils";

interface PerformanceTimelineProps {
  entries: NetworkEntry[];
  selectedEntry: NetworkEntry | null;
  onEntrySelect: (entry: NetworkEntry) => void;
}

export const PerformanceTimeline: React.FC<PerformanceTimelineProps> = ({
  entries,
  selectedEntry,
  onEntrySelect,
}) => {
  const [showCriticalPath, setShowCriticalPath] = React.useState(true);
  const [showMilestones, setShowMilestones] = React.useState(true);
  const [zoomLevel, setZoomLevel] = React.useState(1);

  // Analyze performance data
  const performanceData = React.useMemo(() => {
    if (entries.length === 0) {
      return {
        milestones: [],
        criticalPath: { entries: [], totalTime: 0, bottlenecks: [] },
        startTime: 0,
        endTime: 0,
      };
    }

    const startTime = Math.min(...entries.map(e => new Date(e.startedDateTime).getTime()));
    const endTime = Math.max(
      ...entries.map(e => new Date(e.startedDateTime).getTime() + e.duration)
    );

    // Generate performance milestones
    const milestones: PerformanceMilestone[] = [];

    // Navigation start
    milestones.push({
      name: "Navigation Start",
      time: 0,
      type: "navigation",
      description: "Browser begins navigation",
      color: "#3B82F6",
    });

    // First byte (HTML document)
    const htmlDoc = entries.find(
      e => e.response.content.mimeType.includes("text/html") && e.request.method === "GET"
    );
    if (htmlDoc) {
      const firstByteTime =
        new Date(htmlDoc.startedDateTime).getTime() - startTime + htmlDoc.timings.wait;
      milestones.push({
        name: "First Byte (TTFB)",
        time: firstByteTime,
        type: "navigation",
        description: "Time to first byte of HTML",
        color: "#10B981",
      });

      // DOM content loaded (estimate)
      const domContentTime =
        new Date(htmlDoc.startedDateTime).getTime() - startTime + htmlDoc.duration;
      milestones.push({
        name: "DOM Content Loaded",
        time: domContentTime,
        type: "load",
        description: "HTML parsing complete",
        color: "#F59E0B",
      });
    }

    // First paint (estimate based on CSS loading)
    const cssEntries = entries.filter(e => e.response.content.mimeType.includes("text/css"));
    if (cssEntries.length > 0) {
      const firstCssTime = Math.min(
        ...cssEntries.map(e => new Date(e.startedDateTime).getTime() - startTime + e.duration)
      );
      milestones.push({
        name: "First Paint",
        time: firstCssTime,
        type: "paint",
        description: "First visual content rendered",
        color: "#8B5CF6",
      });
    }

    // Largest contentful paint (estimate based on largest image/content)
    const contentEntries = entries.filter(
      e =>
        e.response.content.mimeType.includes("image/") ||
        e.response.content.mimeType.includes("text/html")
    );
    if (contentEntries.length > 0) {
      const largestContent = contentEntries.reduce((largest, entry) =>
        entry.size > largest.size ? entry : largest
      );
      const lcpTime =
        new Date(largestContent.startedDateTime).getTime() - startTime + largestContent.duration;
      milestones.push({
        name: "Largest Contentful Paint",
        time: lcpTime,
        type: "paint",
        description: "Largest content element rendered",
        color: "#EC4899",
      });
    }

    // Load complete
    milestones.push({
      name: "Load Complete",
      time: endTime - startTime,
      type: "load",
      description: "All resources loaded",
      color: "#EF4444",
    });

    // Analyze critical path
    const criticalPath: CriticalPath = {
      entries: [],
      totalTime: 0,
      bottlenecks: [],
    };

    // Find blocking resources
    const blockingResources = entries.filter(entry => {
      const resourceType = getResourceType(entry.response.content.mimeType, entry.request.url);
      return (
        resourceType === "Document" ||
        resourceType === "Stylesheet" ||
        (resourceType === "Script" && !entry.request.url.includes("async"))
      );
    });

    // Sort by start time to build critical path
    const sortedBlocking = blockingResources.sort(
      (a, b) => new Date(a.startedDateTime).getTime() - new Date(b.startedDateTime).getTime()
    );

    criticalPath.entries = sortedBlocking;
    criticalPath.totalTime = sortedBlocking.reduce((total, entry) => total + entry.duration, 0);

    // Identify bottlenecks
    sortedBlocking.forEach(entry => {
      const issues = [];

      if (entry.duration > 2000) {
        issues.push("Response time > 2s");
      }

      if (entry.size > 1024 * 1024) {
        // > 1MB
        issues.push("Large file size");
      }

      if (entry.response.status >= 300 && entry.response.status < 400) {
        issues.push("Redirect detected");
      }

      if (entry.timings.dns && entry.timings.dns > 200) {
        issues.push("Slow DNS lookup");
      }

      if (entry.timings.connect && entry.timings.connect > 500) {
        issues.push("Slow connection");
      }

      if (issues.length > 0) {
        criticalPath.bottlenecks.push({
          entry,
          issue: issues.join(", "),
          impact: entry.duration > 3000 ? "high" : entry.duration > 1000 ? "medium" : "low",
        });
      }
    });

    return {
      milestones: milestones.sort((a, b) => a.time - b.time),
      criticalPath,
      startTime,
      endTime,
    };
  }, [entries]);

  const totalDuration = performanceData.endTime - performanceData.startTime;
  const timelineWidth = Math.max(800, totalDuration / 10) * zoomLevel; // 10ms per pixel base

  const getTimePosition = (time: number) => {
    return (time / totalDuration) * timelineWidth;
  };

  const getBottleneckColor = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  return (
    <Box>
      {/* Controls */}
      <Paper p="md" mb="md" withBorder>
        <Group justify="space-between">
          <Group gap="md">
            <Switch
              label="Show Critical Path"
              checked={showCriticalPath}
              onChange={e => setShowCriticalPath(e.currentTarget.checked)}
            />
            <Switch
              label="Show Milestones"
              checked={showMilestones}
              onChange={e => setShowMilestones(e.currentTarget.checked)}
            />
          </Group>

          <Group gap="xs">
            <ActionIcon
              variant="light"
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
              disabled={zoomLevel <= 0.5}
            >
              <BsZoomOut size={16} />
            </ActionIcon>
            <Text size="sm" style={{ minWidth: 40, textAlign: "center" }}>
              {(zoomLevel * 100).toFixed(0)}%
            </Text>
            <ActionIcon
              variant="light"
              onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))}
              disabled={zoomLevel >= 3}
            >
              <BsZoomIn size={16} />
            </ActionIcon>
            <ActionIcon variant="light" onClick={() => setZoomLevel(1)}>
              <BsArrowsAngleExpand size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Performance Summary */}
        <Group mt="md" gap="lg">
          <Badge color="blue" variant="light">
            Total Time: {formatDuration(totalDuration)}
          </Badge>
          <Badge color="orange" variant="light">
            Critical Path: {formatDuration(performanceData.criticalPath.totalTime)}
          </Badge>
          <Badge color="red" variant="light">
            Bottlenecks: {performanceData.criticalPath.bottlenecks.length}
          </Badge>
        </Group>

        <Group justify="space-between" mt="md">
          <Group gap="md">
            {[
              { type: "navigation", label: "Navigation", color: "#3B82F6" },
              { type: "paint", label: "Paint Events", color: "#8B5CF6" },
              { type: "load", label: "Load Events", color: "#10B981" },
            ].map(({ type, label, color }) => (
              <Group key={type} gap={4}>
                <Box
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: color,
                    borderRadius: "50%",
                  }}
                />
                <Text size="xs">{label}</Text>
              </Group>
            ))}
          </Group>
          <Group gap="md">
            {[
              { type: "Document", color: "#3B82F6" },
              { type: "CSS", color: "#8B5CF6" },
              { type: "JS", color: "#F59E0B" },
              { type: "Images", color: "#10B981" },
              { type: "XHR", color: "#EF4444" },
            ].map(({ type, color }) => (
              <Group key={type} gap={4}>
                <Box
                  style={{
                    width: 16,
                    height: 8,
                    backgroundColor: color,
                  }}
                />
                <Text size="xs">{type}</Text>
              </Group>
            ))}
          </Group>
        </Group>
      </Paper>

      {/* Timeline */}
      <Paper withBorder style={{ height: "600px", overflow: "hidden" }}>
        <ScrollArea style={{ height: "100%" }}>
          <Box style={{ width: timelineWidth + 200, height: 550 }}>
            <svg width={timelineWidth + 200} height={550}>
              {/* Time axis */}
              <line
                x1={50}
                y1={50}
                x2={timelineWidth + 50}
                y2={50}
                stroke="var(--mantine-color-gray-4)"
                strokeWidth="2"
              />

              {/* Time markers */}
              {Array.from({ length: Math.ceil(totalDuration / 1000) + 1 }, (_, i) => {
                const time = i * 1000;
                const x = getTimePosition(time) + 50;

                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={45}
                      x2={x}
                      y2={55}
                      stroke="var(--mantine-color-gray-4)"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={40}
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--mantine-color-gray-6)"
                    >
                      {formatDuration(time)}
                    </text>
                  </g>
                );
              })}

              {/* Critical Path */}
              {showCriticalPath && (
                <g>
                  <text
                    x={10}
                    y={85}
                    fontSize="12"
                    fontWeight="bold"
                    fill="var(--mantine-color-gray-7)"
                  >
                    Critical Path
                  </text>
                  {performanceData.criticalPath.entries.map((entry, index) => {
                    const startTime =
                      new Date(entry.startedDateTime).getTime() - performanceData.startTime;
                    const x = getTimePosition(startTime) + 50;
                    const width = getTimePosition(entry.duration);
                    const y = 90 + index * 25;

                    return (
                      <g key={entry.id}>
                        <rect
                          x={x}
                          y={y}
                          width={Math.max(width, 2)}
                          height={20}
                          fill="#3B82F6"
                          opacity={selectedEntry?.id === entry.id ? 1 : 0.7}
                          stroke={selectedEntry?.id === entry.id ? "#000" : "transparent"}
                          strokeWidth="2"
                          style={{ cursor: "pointer" }}
                          onClick={() => onEntrySelect(entry)}
                        />
                        <text x={x + 5} y={y + 14} fontSize="9" fill="white" fontWeight="bold">
                          {getResourceType(entry.response.content.mimeType, entry.request.url)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* All Resources */}
              <g>
                <text
                  x={10}
                  y={280}
                  fontSize="12"
                  fontWeight="bold"
                  fill="var(--mantine-color-gray-7)"
                >
                  All Resources
                </text>
                {entries.map((entry, index) => {
                  const startTime =
                    new Date(entry.startedDateTime).getTime() - performanceData.startTime;
                  const x = getTimePosition(startTime) + 50;
                  const width = getTimePosition(entry.duration);
                  const y = 290 + (index % 20) * 12; // Stack up to 20 rows
                  const resourceType = getResourceType(
                    entry.response.content.mimeType,
                    entry.request.url
                  );

                  const colors: Record<string, string> = {
                    Document: "#3B82F6",
                    Stylesheet: "#8B5CF6",
                    Script: "#F59E0B",
                    Image: "#10B981",
                    Font: "#6366F1",
                    XHR: "#EF4444",
                    Media: "#EC4899",
                    Other: "#6B7280",
                  };

                  return (
                    <rect
                      key={entry.id}
                      x={x}
                      y={y}
                      width={Math.max(width, 1)}
                      height={8}
                      fill={colors[resourceType] || colors["Other"]}
                      opacity={selectedEntry?.id === entry.id ? 1 : 0.6}
                      stroke={selectedEntry?.id === entry.id ? "#000" : "transparent"}
                      strokeWidth="1"
                      style={{ cursor: "pointer" }}
                      onClick={() => onEntrySelect(entry)}
                    />
                  );
                })}
              </g>

              {/* Performance Milestones */}
              {showMilestones &&
                performanceData.milestones.map((milestone, index) => {
                  const x = getTimePosition(milestone.time) + 50;

                  return (
                    <g key={index}>
                      <line
                        x1={x}
                        y1={60}
                        x2={x}
                        y2={530}
                        stroke={milestone.color}
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.7"
                      />
                      <circle cx={x} cy={60} r="4" fill={milestone.color} />
                      <text x={x + 8} y={65} fontSize="10" fill={milestone.color} fontWeight="bold">
                        {milestone.name}
                      </text>
                    </g>
                  );
                })}
            </svg>
          </Box>
        </ScrollArea>
      </Paper>

      {/* Bottlenecks Alert */}
      {performanceData.criticalPath.bottlenecks.length > 0 && (
        <Alert icon={<BsExclamationTriangle />} color="orange" mt="md">
          <Text fw={500} mb="xs">
            Performance Bottlenecks Detected
          </Text>
          <Stack gap="xs">
            {performanceData.criticalPath.bottlenecks.slice(0, 3).map((bottleneck, index) => (
              <Group key={index} gap="xs">
                <Badge color={getBottleneckColor(bottleneck.impact)} variant="filled" size="sm">
                  {bottleneck.impact.toUpperCase()}
                </Badge>
                <Text size="sm" style={{ flex: 1 }}>
                  {getDomainFromUrl(bottleneck.entry.request.url)} - {bottleneck.issue}
                </Text>
                <Text size="sm" c="dimmed">
                  {formatDuration(bottleneck.entry.duration)}
                </Text>
              </Group>
            ))}
            {performanceData.criticalPath.bottlenecks.length > 3 && (
              <Text size="sm" c="dimmed">
                +{performanceData.criticalPath.bottlenecks.length - 3} more bottlenecks
              </Text>
            )}
          </Stack>
        </Alert>
      )}
    </Box>
  );
};
