import React, { useMemo } from "react";
import {
  Box,
  Badge,
  Text,
  Group,
  Stack,
  Tabs,
  JsonInput,
  Code,
  Table,
  ScrollArea,
  Divider,
  Title,
} from "@mantine/core";
import { NetworkEntry } from "./types";
import {
  formatFileSize,
  formatDuration,
  getResourceType,
  parseGraphQLOperation,
  parseGraphQLResponse,
  isGraphQLRequest,
} from "./utils";
import { GraphQLViewer } from "./GraphQLViewer";

type OperationType = "query" | "mutation" | "subscription" | "unknown";

// Define interfaces for GraphQL data types
interface GraphQLOperation {
  operationType: OperationType;
  operationName: string | null;
  query: string;
  variables: Record<string, any> | null;
}

interface RequestDetailsProps {
  entry: NetworkEntry;
}

export const RequestDetails: React.FC<RequestDetailsProps> = ({ entry }) => {
  const resourceType = getResourceType(
    entry.response.content.mimeType,
    entry.request.url,
    entry.isGraphQL
  );

  // Parse GraphQL operation and response if this is a GraphQL request
  const graphQLData = useMemo(() => {
    if (!isGraphQLRequest(entry)) {
      return null;
    }

    const rawOperation = parseGraphQLOperation(entry);
    const response = parseGraphQLResponse(entry);

    // Only return if operation exists
    if (!rawOperation) {
      return null;
    }

    // Ensure operationType is one of the expected values
    const operationType =
      rawOperation.operationType === "query" ||
      rawOperation.operationType === "mutation" ||
      rawOperation.operationType === "subscription"
        ? (rawOperation.operationType as OperationType)
        : ("unknown" as OperationType);

    const operation: GraphQLOperation = {
      ...rawOperation,
      operationType,
    };

    return { operation, response };
  }, [entry]);

  const renderHeaders = (headers: Array<{ name: string; value: string }>) => (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Value</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {headers.map((header, index) => (
          <Table.Tr key={index}>
            <Table.Td>
              <Code>{header.name}</Code>
            </Table.Td>
            <Table.Td>
              <Text size="sm" style={{ wordBreak: "break-all" }}>
                {header.value}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  const renderQueryParams = (params: Array<{ name: string; value: string }>) => (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Value</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {params.map((param, index) => (
          <Table.Tr key={index}>
            <Table.Td>
              <Code>{param.name}</Code>
            </Table.Td>
            <Table.Td>
              <Text size="sm" style={{ wordBreak: "break-all" }}>
                {param.value}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  const renderTimings = () => {
    const timings = entry.timings;
    const timingRows = [
      { name: "Blocked", value: timings.blocked, color: "#9CA3AF" },
      { name: "DNS Lookup", value: timings.dns, color: "#FCD34D" },
      { name: "Connecting", value: timings.connect, color: "#F97316" },
      { name: "SSL", value: timings.ssl, color: "#A855F7" },
      { name: "Sending", value: timings.send, color: "#3B82F6" },
      { name: "Waiting", value: timings.wait, color: "#10B981" },
      { name: "Receiving", value: timings.receive, color: "#EF4444" },
    ];

    const totalTime = entry.duration;
    const validTimings = timingRows.filter(t => t.value !== undefined && t.value >= 0);

    return (
      <Stack gap="md">
        {/* Visual timing chart */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Timing Breakdown ({formatDuration(totalTime)} total)
          </Text>
          <Box
            style={{
              display: "flex",
              height: 30,
              border: "1px solid var(--mantine-color-gray-4)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {validTimings.map((timing, index) => {
              const percentage = totalTime > 0 ? (timing.value! / totalTime) * 100 : 0;
              return (
                <Box
                  key={index}
                  style={{
                    backgroundColor: timing.color,
                    width: `${Math.max(percentage, 0.5)}%`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 500,
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                  title={`${timing.name}: ${formatDuration(timing.value!)}`}
                >
                  {percentage > 8 && timing.name.substring(0, 3)}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Detailed timing table */}
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Phase</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Percentage</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {validTimings.map((timing, index) => {
              const percentage = totalTime > 0 ? (timing.value! / totalTime) * 100 : 0;
              return (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Group gap="xs">
                      <Box
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: timing.color,
                          borderRadius: 2,
                        }}
                      />
                      <Text size="sm">{timing.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>{formatDuration(timing.value!)}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {percentage.toFixed(1)}%
                    </Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Stack>
    );
  };

  return (
    <Box p="sm">
      <Stack gap="sm">
        {/* Request Overview */}
        <Box>
          <Group mb="sm">
            <Badge color={entry.statusColor} size="lg">
              {entry.response.status}
            </Badge>
            <Badge variant="light">{entry.request.method}</Badge>
            <Badge variant="outline">{resourceType}</Badge>
          </Group>

          <Text size="sm" c="dimmed" style={{ wordBreak: "break-all" }}>
            {entry.request.url}
          </Text>

          <Group mt="sm" gap="lg">
            <Text size="sm">
              <strong>Size:</strong> {formatFileSize(entry.size)}
            </Text>
            <Text size="sm">
              <strong>Transferred:</strong> {formatFileSize(entry.transferred)}
            </Text>
            <Text size="sm">
              <strong>Duration:</strong> {formatDuration(entry.duration)}
            </Text>
          </Group>
        </Box>

        <Divider />

        {/* Detailed Information */}
        <Tabs defaultValue="headers">
          <Tabs.List
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              backgroundColor: "var(--mantine-color-dark-7)",
            }}
          >
            <Tabs.Tab value="headers">Headers</Tabs.Tab>
            <Tabs.Tab value="response">Response</Tabs.Tab>
            <Tabs.Tab value="request">Request</Tabs.Tab>
            <Tabs.Tab value="timings">Timings</Tabs.Tab>
            {entry.request.queryString.length > 0 && (
              <Tabs.Tab value="params">Query Params</Tabs.Tab>
            )}
            {entry.request.postData && <Tabs.Tab value="payload">Payload</Tabs.Tab>}
            {graphQLData?.operation && <Tabs.Tab value="graphql">GraphQL</Tabs.Tab>}
          </Tabs.List>

          <Tabs.Panel value="headers" pt="md">
            <Title order={5} mb="sm">
              Request Headers
            </Title>
            {renderHeaders(entry.request.headers)}

            <Title order={5} mb="sm" mt="md">
              Response Headers
            </Title>
            {renderHeaders(entry.response.headers)}
          </Tabs.Panel>

          <Tabs.Panel value="response" pt="md">
            <Group mb="sm">
              <Text size="sm">
                <strong>Status:</strong> {entry.response.status} {entry.response.statusText}
              </Text>
              <Text size="sm">
                <strong>Content Type:</strong> {entry.response.content.mimeType}
              </Text>
            </Group>

            {entry.response.content.text ? (
              <Box>
                <Title order={5} mb="sm">
                  Response Body
                </Title>
                {entry.response.content.mimeType.includes("json") ? (
                  <JsonInput
                    value={entry.response.content.text}
                    readOnly
                    autosize
                    minRows={10}
                    maxRows={20}
                  />
                ) : entry.response.content.mimeType.includes("text/") ||
                  entry.response.content.mimeType.includes("application/json") ||
                  entry.response.content.mimeType.includes("application/xml") ? (
                  <Code block style={{ maxHeight: 300, overflow: "auto" }}>
                    {entry.response.content.text}
                  </Code>
                ) : (
                  <Box>
                    <Text size="sm" mb="xs">
                      Binary content ({entry.response.content.mimeType})
                    </Text>
                    <Code block style={{ maxHeight: 300, overflow: "auto" }}>
                      {entry.response.content.text.substring(0, 1000)}
                      {entry.response.content.text.length > 1000 && "\n... (truncated)"}
                    </Code>
                  </Box>
                )}
              </Box>
            ) : entry.response.content.size > 0 ? (
              <Box>
                <Title order={5} mb="sm">
                  Response Body
                </Title>
                <Text c="orange" size="sm">
                  ⚠️ Response content is available ({entry.response.content.size} bytes) but not
                  captured as text in the HAR file.
                  {entry.response.content.encoding &&
                    ` Content encoding: ${entry.response.content.encoding}`}
                </Text>
              </Box>
            ) : (
              <Box>
                <Title order={5} mb="sm">
                  Response Body
                </Title>
                <Text c="dimmed" size="sm">
                  No response content available. This could be because:
                  <ul>
                    <li>The response body was empty</li>
                    <li>The response body was not captured in the HAR file</li>
                    <li>The content is binary and was not included</li>
                  </ul>
                </Text>
              </Box>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="request" pt="md">
            <Group mb="sm">
              <Text size="sm">
                <strong>Method:</strong> {entry.request.method}
              </Text>
              <Text size="sm">
                <strong>HTTP Version:</strong> {entry.request.httpVersion}
              </Text>
            </Group>

            <Title order={5} mb="sm">
              Request Headers
            </Title>
            {renderHeaders(entry.request.headers)}
          </Tabs.Panel>

          <Tabs.Panel value="timings" pt="md">
            <Title order={5} mb="sm">
              Network Timing Breakdown
            </Title>
            {renderTimings()}
          </Tabs.Panel>

          {entry.request.queryString.length > 0 && (
            <Tabs.Panel value="params" pt="md">
              <ScrollArea style={{ height: 400 }}>
                <Title order={5} mb="sm">
                  Query Parameters
                </Title>
                {renderQueryParams(entry.request.queryString)}
              </ScrollArea>
            </Tabs.Panel>
          )}

          {entry.request.postData && (
            <Tabs.Panel value="payload" pt="md">
              <Title order={5} mb="sm">
                Request Payload
              </Title>
              <Text size="sm" c="dimmed" mb="sm">
                Content Type: {entry.request.postData.mimeType}
              </Text>

              {entry.request.postData.text &&
                (entry.request.postData.mimeType.includes("json") ? (
                  <JsonInput
                    value={entry.request.postData.text}
                    readOnly
                    autosize
                    minRows={10}
                    maxRows={20}
                  />
                ) : (
                  <Code block style={{ maxHeight: 300, overflow: "auto" }}>
                    {entry.request.postData.text}
                  </Code>
                ))}

              {entry.request.postData.params && entry.request.postData.params.length > 0 && (
                <Box mt="md">
                  <Title order={6} mb="sm">
                    Form Parameters
                  </Title>
                  {renderQueryParams(
                    entry.request.postData.params.map(p => ({
                      name: p.name,
                      value: p.value || "",
                    }))
                  )}
                </Box>
              )}
            </Tabs.Panel>
          )}

          {graphQLData?.operation && (
            <Tabs.Panel value="graphql" pt="md">
              <GraphQLViewer
                entry={entry}
                parsedOperation={graphQLData.operation as any}
                parsedResponse={graphQLData.response}
              />
            </Tabs.Panel>
          )}
        </Tabs>
      </Stack>
    </Box>
  );
};
