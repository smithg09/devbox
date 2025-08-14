import React from "react";
import {
  Table,
  ScrollArea,
  Badge,
  Text,
  ActionIcon,
  Tooltip,
  Box,
  UnstyledButton,
} from "@mantine/core";
import { BsChevronUp, BsChevronDown, BsInfoCircle } from "react-icons/bs";
import { NetworkEntry } from "./types";
import { formatFileSize, formatDuration, getResourceType } from "./utils";

interface NetworkTableProps {
  entries: NetworkEntry[];
  selectedEntry: NetworkEntry | null;
  onEntrySelect: (entry: NetworkEntry) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

export const NetworkTable: React.FC<NetworkTableProps> = ({
  entries,
  selectedEntry,
  onEntrySelect,
  sortField,
  sortDirection,
  onSort,
}) => {
  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <UnstyledButton
      onClick={() => onSort(field)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        width: "100%",
        padding: "4px 0",
      }}
    >
      <Text fw={500} size="sm">
        {children}
      </Text>
      {sortField === field &&
        (sortDirection === "asc" ? <BsChevronUp size={12} /> : <BsChevronDown size={12} />)}
    </UnstyledButton>
  );

  const getRowColor = (entry: NetworkEntry) => {
    if (selectedEntry?.id === entry.id) {
      return "var(--mantine-color-blue-light)";
    }
    return undefined;
  };

  const formatUrl = (url: string, maxLength: number = 50) => {
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

  return (
    <ScrollArea style={{ height: "calc(100vh - 300px)" }}>
      <Table highlightOnHover striped withColumnBorders>
        <Table.Thead
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: "var(--mantine-color-body)",
          }}
        >
          <Table.Tr>
            <Table.Th style={{ minWidth: 200 }}>
              <SortableHeader field="url">URL</SortableHeader>
            </Table.Th>
            <Table.Th style={{ width: 100 }}>
              <SortableHeader field="method">Method</SortableHeader>
            </Table.Th>
            <Table.Th style={{ width: 100 }}>
              <SortableHeader field="status">Status</SortableHeader>
            </Table.Th>
            <Table.Th style={{ width: 120 }}>
              <SortableHeader field="size">Size</SortableHeader>
            </Table.Th>
            <Table.Th style={{ width: 120 }}>
              <SortableHeader field="time">Time</SortableHeader>
            </Table.Th>
            <Table.Th style={{ width: 250 }}>Type</Table.Th>
            <Table.Th style={{ width: 60 }}>
              <SortableHeader field="domain">Domain</SortableHeader>
            </Table.Th>
            <Table.Th style={{ width: 40 }}>Details</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {entries.map(entry => {
            const resourceType = getResourceType(
              entry.response.content.mimeType,
              entry.request.url,
              entry.isGraphQL
            );

            return (
              <Table.Tr
                key={entry.id}
                style={{
                  backgroundColor: getRowColor(entry),
                  cursor: "pointer",
                }}
                onClick={() => onEntrySelect(entry)}
              >
                <Table.Td>
                  <Tooltip label={entry.request.url} position="top" withArrow>
                    <Text size="sm" style={{ fontFamily: "monospace" }}>
                      {formatUrl(entry.request.url, 60)}
                    </Text>
                  </Tooltip>
                </Table.Td>

                <Table.Td>
                  <Badge
                    color={
                      entry.request.method === "GET"
                        ? "blue"
                        : entry.request.method === "POST"
                          ? "green"
                          : entry.request.method === "PUT"
                            ? "orange"
                            : entry.request.method === "DELETE"
                              ? "red"
                              : "gray"
                    }
                    variant="light"
                    size="sm"
                  >
                    {entry.request.method}
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Badge
                    color={entry.statusColor}
                    variant={entry.response.status >= 400 ? "filled" : "light"}
                    size="sm"
                  >
                    {entry.response.status}
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Text size="sm" style={{ fontFamily: "monospace" }}>
                    {formatFileSize(entry.size)}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Text size="sm" style={{ fontFamily: "monospace" }}>
                    {formatDuration(entry.duration)}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Badge
                    variant={resourceType === "GraphQL" ? "filled" : "outline"}
                    color={resourceType === "GraphQL" ? "violet" : "gray"}
                    size="sm"
                  >
                    {resourceType}
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {entry.domain}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      onEntrySelect(entry);
                    }}
                  >
                    <BsInfoCircle size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      {entries.length === 0 && (
        <Box ta="center" py="xl">
          <Text c="dimmed">No network requests found</Text>
        </Box>
      )}
    </ScrollArea>
  );
};
