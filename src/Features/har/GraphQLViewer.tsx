import React from "react";
import {
  Box,
  Text,
  Tabs,
  JsonInput,
  Code,
  Paper,
  Title,
  Stack,
  Group,
  Badge,
  Accordion,
} from "@mantine/core";
import { NetworkEntry } from "./types";

interface GraphQLOperation {
  operationType: "query" | "mutation" | "subscription" | "unknown";
  operationName: string | null;
  query: string;
  variables: Record<string, any> | null;
}

interface GraphQLResponse {
  data?: any;
  errors?: Array<any>;
}

interface GraphQLViewerProps {
  entry: NetworkEntry;
  parsedOperation: GraphQLOperation;
  parsedResponse: GraphQLResponse | null;
}

export const GraphQLViewer: React.FC<GraphQLViewerProps> = ({
  parsedOperation,
  parsedResponse,
}) => {
  return (
    <Stack gap="md">
      <Group>
        <Badge color={parsedOperation.operationType === "query" ? "blue" : "orange"} size="lg">
          {parsedOperation.operationType.toUpperCase()}
        </Badge>
        {parsedOperation.operationName && (
          <Badge variant="outline" size="lg">
            {parsedOperation.operationName}
          </Badge>
        )}
      </Group>

      <Tabs defaultValue="query">
        <Tabs.List>
          <Tabs.Tab value="query">Query</Tabs.Tab>
          {parsedOperation.variables && Object.keys(parsedOperation.variables).length > 0 && (
            <Tabs.Tab value="variables">Variables</Tabs.Tab>
          )}
          {parsedResponse && <Tabs.Tab value="response">Response</Tabs.Tab>}
        </Tabs.List>

        <Tabs.Panel value="query" pt="md">
          <Title order={5} mb="sm">
            GraphQL Query
          </Title>
          <Paper withBorder p="xs">
            <Code block style={{ whiteSpace: "pre-wrap" }}>
              {parsedOperation.query}
            </Code>
          </Paper>
        </Tabs.Panel>

        {parsedOperation.variables && Object.keys(parsedOperation.variables).length > 0 && (
          <Tabs.Panel value="variables" pt="md">
            <Title order={5} mb="sm">
              Query Variables
            </Title>
            <JsonInput
              value={JSON.stringify(parsedOperation.variables, null, 2)}
              readOnly
              autosize
              minRows={10}
              maxRows={20}
            />
          </Tabs.Panel>
        )}

        {parsedResponse && (
          <Tabs.Panel value="response" pt="md">
            <Title order={5} mb="sm">
              GraphQL Response
            </Title>
            <Stack gap="md">
              {parsedResponse.data && (
                <Accordion>
                  <Accordion.Item value="data">
                    <Accordion.Control>
                      <Text fw={500}>Data</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <JsonInput
                        value={JSON.stringify(parsedResponse.data, null, 2)}
                        readOnly
                        autosize
                        minRows={5}
                        maxRows={15}
                      />
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              )}

              {parsedResponse.errors && parsedResponse.errors.length > 0 && (
                <Box>
                  <Title order={6} mb="sm" c="red">
                    Errors
                  </Title>
                  <JsonInput
                    value={JSON.stringify(parsedResponse.errors, null, 2)}
                    readOnly
                    autosize
                    minRows={5}
                    maxRows={15}
                  />
                </Box>
              )}
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>
    </Stack>
  );
};
