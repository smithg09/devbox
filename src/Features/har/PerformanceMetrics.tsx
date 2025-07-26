import React from "react";
import { Group, Text, Card, SimpleGrid, Progress, Badge, Stack, Box } from "@mantine/core";
import { NetworkEntry } from "./types";
import { formatFileSize, formatDuration, getResourceType } from "./utils";

interface PerformanceMetricsProps {
  entries: NetworkEntry[];
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ entries }) => {
  const metrics = React.useMemo(() => {
    if (entries.length === 0) {
      return {
        totalRequests: 0,
        totalSize: 0,
        totalTransferred: 0,
        averageTime: 0,
        slowestRequest: null as NetworkEntry | null,
        largestRequest: null as NetworkEntry | null,
        resourceTypes: {} as Record<string, { count: number; size: number }>,
        domainBreakdown: {} as Record<string, { count: number; size: number }>,
        httpMethods: {} as Record<string, number>,
        statusCodes: {} as Record<number, number>,
      };
    }

    // Basic metrics
    const totalRequests = entries.length;
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalTransferred = entries.reduce((sum, entry) => sum + entry.transferred, 0);
    const averageTime = entries.reduce((sum, entry) => sum + entry.duration, 0) / entries.length;

    // Find extremes
    const slowestRequest = entries.reduce((slowest, entry) =>
      entry.duration > slowest.duration ? entry : slowest
    );
    const largestRequest = entries.reduce((largest, entry) =>
      entry.size > largest.size ? entry : largest
    );

    // Resource type breakdown
    const resourceTypes: Record<string, { count: number; size: number }> = {};
    entries.forEach(entry => {
      const type = getResourceType(entry.response.content.mimeType, entry.request.url);
      if (!resourceTypes[type]) {
        resourceTypes[type] = { count: 0, size: 0 };
      }
      resourceTypes[type].count++;
      resourceTypes[type].size += entry.size;
    });

    // Domain breakdown
    const domainBreakdown: Record<string, { count: number; size: number }> = {};
    entries.forEach(entry => {
      const domain = entry.domain;
      if (!domainBreakdown[domain]) {
        domainBreakdown[domain] = { count: 0, size: 0 };
      }
      domainBreakdown[domain].count++;
      domainBreakdown[domain].size += entry.size;
    });

    // HTTP methods
    const httpMethods: Record<string, number> = {};
    entries.forEach(entry => {
      httpMethods[entry.request.method] = (httpMethods[entry.request.method] || 0) + 1;
    });

    // Status codes
    const statusCodes: Record<number, number> = {};
    entries.forEach(entry => {
      statusCodes[entry.response.status] = (statusCodes[entry.response.status] || 0) + 1;
    });

    return {
      totalRequests,
      totalSize,
      totalTransferred,
      averageTime,
      slowestRequest,
      largestRequest,
      resourceTypes,
      domainBreakdown,
      httpMethods,
      statusCodes,
    };
  }, [entries]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "green";
    if (status >= 300 && status < 400) return "blue";
    if (status >= 400 && status < 500) return "orange";
    if (status >= 500) return "red";
    return "gray";
  };

  if (entries.length === 0) {
    return (
      <Card withBorder p="md">
        <Text c="dimmed" ta="center">
          No data to analyze
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {/* Overview Metrics */}
      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <Card withBorder p="md">
          <Text size="sm" c="dimmed">
            Total Requests
          </Text>
          <Text size="xl" fw={700}>
            {metrics.totalRequests}
          </Text>
        </Card>

        <Card withBorder p="md">
          <Text size="sm" c="dimmed">
            Total Size
          </Text>
          <Text size="xl" fw={700}>
            {formatFileSize(metrics.totalSize)}
          </Text>
        </Card>

        <Card withBorder p="md">
          <Text size="sm" c="dimmed">
            Transferred
          </Text>
          <Text size="xl" fw={700}>
            {formatFileSize(metrics.totalTransferred)}
          </Text>
        </Card>

        <Card withBorder p="md">
          <Text size="sm" c="dimmed">
            Avg Response Time
          </Text>
          <Text size="xl" fw={700}>
            {formatDuration(metrics.averageTime)}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Extremes */}
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card withBorder p="md">
          <Text size="sm" fw={500} mb="xs">
            Slowest Request
          </Text>
          {metrics.slowestRequest && (
            <Box>
              <Text size="sm" truncate style={{ fontFamily: "monospace" }}>
                {metrics.slowestRequest.request.url}
              </Text>
              <Group gap="xs" mt={4}>
                <Badge size="sm">{formatDuration(metrics.slowestRequest.duration)}</Badge>
                <Badge variant="outline" size="sm">
                  {metrics.slowestRequest.response.status}
                </Badge>
              </Group>
            </Box>
          )}
        </Card>

        <Card withBorder p="md">
          <Text size="sm" fw={500} mb="xs">
            Largest Request
          </Text>
          {metrics.largestRequest && (
            <Box>
              <Text size="sm" truncate style={{ fontFamily: "monospace" }}>
                {metrics.largestRequest.request.url}
              </Text>
              <Group gap="xs" mt={4}>
                <Badge size="sm">{formatFileSize(metrics.largestRequest.size)}</Badge>
                <Badge variant="outline" size="sm">
                  {metrics.largestRequest.response.status}
                </Badge>
              </Group>
            </Box>
          )}
        </Card>
      </SimpleGrid>

      {/* Resource Types */}
      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="md">
          Resource Types
        </Text>
        <Stack gap="xs">
          {Object.entries(metrics.resourceTypes)
            .sort(([, a], [, b]) => b.size - a.size)
            .slice(0, 8)
            .map(([type, data]) => {
              const percentage = (data.size / metrics.totalSize) * 100;
              return (
                <Box key={type}>
                  <Group justify="space-between" mb={4}>
                    <Text size="sm">{type}</Text>
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        {data.count} requests
                      </Text>
                      <Text size="xs">{formatFileSize(data.size)}</Text>
                    </Group>
                  </Group>
                  <Progress value={percentage} size="sm" />
                </Box>
              );
            })}
        </Stack>
      </Card>

      {/* Status Code Distribution */}
      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="md">
          Status Codes
        </Text>
        <Group gap="xs">
          {Object.entries(metrics.statusCodes)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([status, count]) => (
              <Badge key={status} color={getStatusColor(Number(status))} variant="light">
                {status}: {count}
              </Badge>
            ))}
        </Group>
      </Card>

      {/* HTTP Methods */}
      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="md">
          HTTP Methods
        </Text>
        <Group gap="xs">
          {Object.entries(metrics.httpMethods)
            .sort(([, a], [, b]) => b - a)
            .map(([method, count]) => (
              <Badge key={method} variant="outline">
                {method}: {count}
              </Badge>
            ))}
        </Group>
      </Card>

      {/* Domain Breakdown */}
      <Card withBorder p="md">
        <Text size="sm" fw={500} mb="md">
          Top Domains
        </Text>
        <Stack gap="xs">
          {Object.entries(metrics.domainBreakdown)
            .sort(([, a], [, b]) => b.size - a.size)
            .slice(0, 6)
            .map(([domain, data]) => {
              const percentage = (data.size / metrics.totalSize) * 100;
              return (
                <Box key={domain}>
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" truncate style={{ maxWidth: "60%" }}>
                      {domain}
                    </Text>
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        {data.count} requests
                      </Text>
                      <Text size="xs">{formatFileSize(data.size)}</Text>
                    </Group>
                  </Group>
                  <Progress value={percentage} size="sm" />
                </Box>
              );
            })}
        </Stack>
      </Card>
    </Stack>
  );
};
