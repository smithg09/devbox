import { Badge, Box, Button, Collapse, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { TbBrandGraphql } from "react-icons/tb";
import { syncGlobalMonacoTheme } from "../../Components/Monaco/utils";
import { GraphiQLTab } from "./components/GraphiQLTab";
import { HeadersEditor } from "./components/HeadersEditor";
import { DEFAULT_HEADERS, DEFAULT_QUERY, GraphQLTab } from "./types/graphql";

import "graphiql/style.css";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import "./styles/graphiql.css";

export default function GraphiQL() {
  const [graphqlState, setGraphqlState] = useState<GraphQLTab>({
    id: crypto.randomUUID(),
    title: "GraphQL",
    endpoint: "https://spacex-production.up.railway.app/",
    query: DEFAULT_QUERY,
    variables: "{}",
    headers: [...DEFAULT_HEADERS],
    isLoading: false,
  });
  const [showHeaders, setShowHeaders] = useState(false);

  const updateGraphqlState = useCallback((updates: Partial<GraphQLTab>) => {
    setGraphqlState(prev => ({ ...prev, ...updates }));
  }, []);

  // Sync Monaco theme when GraphiQL component mounts
  useEffect(() => {
    // Multiple sync attempts to ensure it catches Monaco when it loads
    const syncTheme = () => syncGlobalMonacoTheme();

    syncTheme(); // Immediate sync

    const timeouts = [
      setTimeout(syncTheme, 100),
      setTimeout(syncTheme, 500),
      setTimeout(syncTheme, 1000),
    ];

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const handleExecute = useCallback(() => {
    // The execute is handled by GraphiQL component itself
    // This is just for UI feedback
    if (!graphqlState.endpoint) {
      updateGraphqlState({
        lastError: "Please enter a valid GraphQL endpoint",
      });
    }
  }, [graphqlState.endpoint, updateGraphqlState]);

  return (
    <Stack h="100vh" gap={0}>
      <Paper p="sm" radius={0} withBorder={false} mt="xs">
        <Group gap="sm">
          <TbBrandGraphql size={20} />
          <TextInput
            placeholder="Enter GraphQL endpoint URL"
            value={graphqlState.endpoint}
            onChange={e => updateGraphqlState({ endpoint: e.currentTarget.value })}
            style={{ flex: 1 }}
            size="sm"
          />

          <Button
            size="sm"
            variant="light"
            onClick={() => setShowHeaders(!showHeaders)}
            rightSection={showHeaders ? <BsChevronUp size={16} /> : <BsChevronDown size={16} />}
          >
            Headers
          </Button>
        </Group>
      </Paper>

      {/* Headers Editor (Collapsible) */}
      <Collapse in={showHeaders}>
        <Box p="sm" style={{ borderBottom: "1px solid var(--mantine-color-gray-8)" }}>
          <HeadersEditor
            headers={graphqlState.headers}
            onChange={headers => updateGraphqlState({ headers })}
          />
        </Box>
      </Collapse>

      {/* GraphiQL Editor */}
      <Box style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {graphqlState.endpoint ? (
          <Box key={graphqlState.id} h="100%">
            <GraphiQLTab
              tab={graphqlState}
              onUpdate={updateGraphqlState}
              onExecute={handleExecute}
            />
          </Box>
        ) : (
          <Paper
            p="xl"
            h="100%"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            withBorder={false}
          >
            <Stack align="center" gap="md">
              <TbBrandGraphql size={48} style={{ opacity: 0.5 }} />
              <Text size="lg" c="dimmed">
                Enter a GraphQL endpoint to get started
              </Text>
              <Text size="sm" c="dimmed">
                Try: https://spacex-production.up.railway.app/
              </Text>
            </Stack>
          </Paper>
        )}
      </Box>

      {/* Inline Error Display */}
      {graphqlState.lastError && (
        <Paper p="sm" bg="red.0" style={{ borderTop: "2px solid var(--mantine-color-red-5)" }}>
          <Group gap="xs">
            <Badge color="red">Error</Badge>
            <Text size="sm" c="red">
              {graphqlState.lastError}
            </Text>
          </Group>
        </Paper>
      )}
    </Stack>
  );
}
