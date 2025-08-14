import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { KeyValue } from "../types/graphql";

export function createFetcher(endpoint: string, headers: KeyValue[]) {
  // Build headers object from key-value pairs
  const headersObj: Record<string, string> = {
    "Content-Type": "application/json",
  };

  headers.forEach(header => {
    if (header.enabled && header.key && header.value) {
      headersObj[header.key] = header.value;
    }
  });

  return createGraphiQLFetcher({
    url: endpoint,
    headers: headersObj,
  });
}

export function buildHeadersObject(headers: KeyValue[]): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach(header => {
    if (header.enabled && header.key && header.value) {
      result[header.key] = header.value;
    }
  });
  return result;
}
