import React, { useRef, useCallback } from "react";
import {
  Group,
  TextInput,
  Select,
  Button,
  Badge,
  Text,
  Stack,
  Grid,
  Card,
  Flex,
} from "@mantine/core";
import { BsSearch, BsX } from "react-icons/bs";
import { NetworkEntry } from "./types";
import { formatFileSize, formatDuration, calculateSummaryStats } from "./utils";
import classes from "./har.module.css";

interface NetworkFiltersProps {
  entries: NetworkEntry[];
  filteredEntries: NetworkEntry[];
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export const NetworkFilters: React.FC<NetworkFiltersProps> = ({
  entries,
  filteredEntries,
  filters,
  onFiltersChange,
}) => {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stats = calculateSummaryStats(filteredEntries);

  // Debounced search handler
  const handleSearchChange = useCallback(
    (value: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        onFiltersChange({ ...filters, search: value });
      }, 300);
    },
    [filters, onFiltersChange]
  );

  // Get unique values for filter dropdowns
  const domains = Array.from(new Set(entries.map(e => e.domain))).sort();
  const methods = Array.from(new Set(entries.map(e => e.request.method))).sort();

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "2xx", label: "2xx (Success)" },
    { value: "3xx", label: "3xx (Redirect)" },
    { value: "4xx", label: "4xx (Client Error)" },
    { value: "5xx", label: "5xx (Server Error)" },
  ];

  const resourceTypeOptions = [
    { value: "all", label: "All" },
    { value: "xhr", label: "Fetch/XHR" },
    { value: "graphql", label: "GraphQL" },
    { value: "document", label: "Doc" },
    { value: "stylesheet", label: "CSS" },
    { value: "script", label: "JS" },
    { value: "image", label: "Img" },
    { value: "font", label: "Font" },
    { value: "media", label: "Media" },
    { value: "other", label: "Other" },
  ];

  const hasActiveFilters =
    filters.search ||
    (filters.domain && filters.domain !== "all") ||
    (filters.method && filters.method !== "all") ||
    (filters.status && filters.status !== "all") ||
    (filters.resourceType && filters.resourceType !== "all");

  return (
    <Stack gap="md" mb={16}>
      {/* Filter Controls */}
      <Grid>
        <Grid.Col span={{ base: 3, md: 3, lg: 3 }}>
          <TextInput
            placeholder="Search requests..."
            leftSection={<BsSearch size={16} />}
            value={filters.search}
            onChange={e => handleSearchChange(e.target.value)}
            rightSection={
              filters.search && (
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => onFiltersChange({ ...filters, search: "" })}
                >
                  <BsX size={16} />
                </Button>
              )
            }
          />
        </Grid.Col>

        <Grid.Col span={{ base: 3, md: 3, lg: 3 }}>
          <Select
            placeholder="Domain"
            value={filters.domain}
            onChange={value => onFiltersChange({ ...filters, domain: value })}
            data={[
              { value: "all", label: "All Domains" },
              ...domains.map(d => ({ value: d, label: d })),
            ]}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 3, md: 3, lg: 3 }}>
          <Select
            placeholder="Method"
            value={filters.method}
            onChange={value => onFiltersChange({ ...filters, method: value })}
            data={[
              { value: "all", label: "All Methods" },
              ...methods.map(m => ({ value: m, label: m })),
            ]}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 3, md: 3, lg: 3 }}>
          <Select
            placeholder="Status"
            value={filters.status}
            onChange={value => onFiltersChange({ ...filters, status: value })}
            data={statusOptions}
          />
        </Grid.Col>
      </Grid>
      <Flex justify="flex-start" align="center">
        {resourceTypeOptions.length > 0 &&
          resourceTypeOptions.map(({ label, value }) => (
            <Badge
              mb={4}
              mr={4}
              bg={
                filters.resourceType === value
                  ? "var(--mantine-primary-color-filled)"
                  : "transparent"
              }
              key={value}
              onClick={() => onFiltersChange({ ...filters, resourceType: value })}
              className={classes.customBadge}
              style={{ cursor: "pointer" }}
            >
              {label}
            </Badge>
          ))}
      </Flex>

      {/* Summary Statistics */}
      <Card withBorder p="md">
        <Group justify="space-between" mb="md">
          <Text fw={500}>Network Summary</Text>
          <Group gap="xs">
            <Badge variant="light">
              {filteredEntries.length} of {entries.length} requests
            </Badge>
            {hasActiveFilters && (
              <Badge color="blue" variant="filled">
                Filtered
              </Badge>
            )}
          </Group>
        </Group>

        <Grid>
          <Grid.Col span={{ base: 3, md: 3 }}>
            <Text size="sm" c="dimmed">
              Total Size
            </Text>
            <Text fw={500}>{formatFileSize(stats.totalSize)}</Text>
          </Grid.Col>

          <Grid.Col span={{ base: 3, md: 3 }}>
            <Text size="sm" c="dimmed">
              Transferred
            </Text>
            <Text fw={500}>{formatFileSize(stats.totalTransferred)}</Text>
          </Grid.Col>

          <Grid.Col span={{ base: 3, md: 3 }}>
            <Text size="sm" c="dimmed">
              Average Time
            </Text>
            <Text fw={500}>{formatDuration(stats.averageTime)}</Text>
          </Grid.Col>

          <Grid.Col span={{ base: 3, md: 3 }}>
            <Text size="sm" c="dimmed">
              Total Requests
            </Text>
            <Text fw={500}>{stats.totalRequests}</Text>
          </Grid.Col>
        </Grid>

        {/* Status Code Distribution */}
        <Grid>
          <Grid.Col span={6}>
            <Group mt="md" gap="xs">
              <Text size="sm" c="dimmed">
                Status:
              </Text>
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <Badge
                  key={status}
                  color={
                    status.startsWith("2")
                      ? "green"
                      : status.startsWith("3")
                        ? "blue"
                        : status.startsWith("4")
                          ? "orange"
                          : "red"
                  }
                  variant="light"
                  size="xs"
                >
                  {status}xx: {count}
                </Badge>
              ))}
            </Group>
          </Grid.Col>
          <Grid.Col span={6}>
            {/* Method Distribution */}
            <Group mt="xs" gap="xs">
              <Text size="sm" c="dimmed">
                Methods:
              </Text>
              {Object.entries(stats.methodCounts).map(([method, count]) => (
                <Badge key={method} variant="outline" size="xs">
                  {method}: {count}
                </Badge>
              ))}
            </Group>
          </Grid.Col>
        </Grid>
      </Card>
    </Stack>
  );
};
