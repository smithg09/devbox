import { GraphiQLProvider } from "@graphiql/react";

import { Badge, Group } from "@mantine/core";
import { GraphiQL } from "graphiql";
import React, { useEffect, useMemo, useRef } from "react";
import { syncGlobalMonacoTheme } from "../../../Components/Monaco/utils";
import { GraphQLTab } from "../types/graphql";
import { buildHeadersObject } from "../utils/fetcher";

import "graphiql/style.css";

interface GraphiQLTabProps {
  tab: GraphQLTab;
  onUpdate: (updates: Partial<GraphQLTab>) => void;
  onExecute?: () => void;
}

export const GraphiQLTab: React.FC<GraphiQLTabProps> = ({ tab, onUpdate }) => {
  const startTimeRef = useRef<number>(0);

  // Sync Monaco theme with GraphiQL when component mounts
  useEffect(() => {
    // Use a small delay to ensure GraphiQL's Monaco is loaded
    const timeoutId = setTimeout(() => {
      syncGlobalMonacoTheme();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  const fetcher = useMemo(() => {
    if (!tab.endpoint) return null;

    const headersObj = buildHeadersObject(tab.headers);

    // Create a custom fetcher function that handles metrics
    return async (graphQLParams: any, opts: any) => {
      startTimeRef.current = performance.now();
      const { headers = {} } = opts;

      try {
        const response = await fetch(tab.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...headersObj,
            ...headers,
          },
          body: JSON.stringify(graphQLParams),
          mode: "cors",
          credentials: "omit",
        });

        const duration = performance.now() - startTimeRef.current;

        // Clone response to read it first
        const clonedResponse = response.clone();
        const responseText = await clonedResponse.text();
        const responseSize = new Blob([responseText]).size;

        // Parse response
        let jsonResponse;
        try {
          jsonResponse = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Invalid JSON response: ${responseText}`);
        }

        // Update metrics and response
        onUpdate({
          response: {
            data: jsonResponse.data,
            errors: jsonResponse.errors,
            extensions: jsonResponse.extensions,
            duration: Math.round(duration),
            size: responseSize,
          },
          lastError: undefined,
        });

        // Check for HTTP errors after updating metrics
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}${responseText ? ` - ${responseText}` : ""}`
          );
        }

        return jsonResponse;
      } catch (error) {
        const duration = performance.now() - startTimeRef.current;
        let errorMessage = "Request failed";

        if (error instanceof Error) {
          if (error.name === "NotAllowedError" || error.message.includes("CORS")) {
            errorMessage =
              "CORS error: The GraphQL endpoint doesn't allow requests from this origin. You may need to use a CORS proxy or configure the server to allow cross-origin requests.";
          } else if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
            errorMessage =
              "Network error: Unable to reach the GraphQL endpoint. Check the URL and your internet connection.";
          } else {
            errorMessage = error.message;
          }
        }

        onUpdate({
          lastError: errorMessage,
          response: {
            data: undefined,
            errors: [{ message: errorMessage }],
            extensions: undefined,
            duration: Math.round(duration),
            size: 0,
          },
        });

        throw error;
      }
    };
  }, [tab.endpoint, tab.headers, onUpdate]);

  if (!fetcher) {
    return null;
  }

  return (
    <GraphiQLProvider fetcher={fetcher} shouldPersistHeaders={false}>
      <GraphiQL
        defaultEditorToolsVisibility="variables"
        initialQuery={tab.query}
        fetcher={fetcher}
        onEditQuery={(query: string) => onUpdate({ query })}
        onEditVariables={(variables: string) => onUpdate({ variables })}
        onEditOperationName={(operationName: string) => onUpdate({ operationName })}
      >
        <GraphiQL.Logo>
          <Group gap="xs">
            {tab.response && (
              <Group gap="xs" mb={4}>
                <Badge size="sm" variant="light" color={tab.response.errors ? "red" : "green"}>
                  {tab.response.errors ? "Error" : "Success"}
                </Badge>
                <Badge size="sm" variant="light">
                  {tab.response.duration}ms
                </Badge>
                <Badge size="sm" variant="light">
                  {(tab.response.size / 1024).toFixed(2)}KB
                </Badge>
              </Group>
            )}
          </Group>
        </GraphiQL.Logo>
      </GraphiQL>
    </GraphiQLProvider>
  );
};
