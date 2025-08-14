import { HarFile, HarEntry, NetworkEntry } from "./types";

export function formatFileSize(bytes: number): string {
  // Handle invalid inputs
  if (!bytes || bytes <= 0 || isNaN(bytes) || !isFinite(bytes)) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Ensure index is within bounds
  const sizeIndex = Math.min(i, sizes.length - 1);
  const formattedSize = (bytes / Math.pow(k, sizeIndex)).toFixed(1);

  return parseFloat(formattedSize) + " " + sizes[sizeIndex];
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "green";
  if (status >= 300 && status < 400) return "blue";
  if (status >= 400 && status < 500) return "orange";
  if (status >= 500) return "red";
  return "gray";
}

export function getResourceType(mimeType: string, url: string, isGraphQL: boolean = false): string {
  if (isGraphQL) return "GraphQL";
  if (mimeType.includes("text/html")) return "Document";
  if (mimeType.includes("text/css")) return "Stylesheet";
  if (mimeType.includes("javascript") || mimeType.includes("text/js")) return "Script";
  if (mimeType.includes("image/")) return "Image";
  if (mimeType.includes("font/") || url.includes(".woff") || url.includes(".ttf")) return "Font";
  if (mimeType.includes("application/json") || mimeType.includes("application/xml")) return "XHR";
  if (mimeType.includes("video/")) return "Media";
  if (mimeType.includes("audio/")) return "Media";
  return "Other";
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function getPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
}

export function parseHarFile(harFile: HarFile): NetworkEntry[] {
  return harFile.log.entries.map((entry: HarEntry, index: number) => {
    const url = entry.request.url;
    const domain = getDomainFromUrl(url);
    const path = getPathFromUrl(url);
    const size = entry.response.content.size || 0;

    // Calculate transferred bytes more accurately
    // HAR spec: bodySize can be -1 if unknown, use content.size as fallback
    let transferred = entry.response.bodySize;
    if (transferred === undefined || transferred === null || transferred < 0) {
      // Fallback to content size, or calculate from headers
      transferred = size;

      // If we have response headers, try to get the actual transferred size
      const contentLengthHeader = entry.response.headers.find(
        h => h.name.toLowerCase() === "content-length"
      );
      if (contentLengthHeader) {
        const contentLength = parseInt(contentLengthHeader.value, 10);
        if (!isNaN(contentLength) && contentLength >= 0) {
          transferred = contentLength;
        }
      }
    }

    const duration = entry.time;

    // Process the entry (decode base64 content if needed)
    let processedEntry = { ...entry };
    if (entry.response.content.text && entry.response.content.encoding === "base64") {
      try {
        // Decode base64 content
        const decodedContent = atob(entry.response.content.text);
        processedEntry = {
          ...entry,
          response: {
            ...entry.response,
            content: {
              ...entry.response.content,
              text: decodedContent,
              encoding: undefined, // Remove encoding since we've decoded it
            },
          },
        };
      } catch (error) {
        console.warn(`Failed to decode base64 content for ${url}:`, error);
      }
    }

    // Create the NetworkEntry object
    const networkEntry: NetworkEntry = {
      ...processedEntry,
      id: `entry-${index}`,
      domain,
      path,
      size,
      transferred,
      duration,
      statusColor: getStatusColor(entry.response.status),
      initiator: entry.request.headers.find(h => h.name.toLowerCase() === "referer")?.value || "",
    };

    // Check if it's a GraphQL request
    const isGraphQL = isGraphQLRequest(networkEntry);
    networkEntry.isGraphQL = isGraphQL;
    networkEntry.statusColor = getStatusColor(entry.response.status);

    return networkEntry;
  });
}

export function filterEntries(entries: NetworkEntry[], filters: any): NetworkEntry[] {
  return entries.filter(entry => {
    // Search filter
    if (filters.search && !entry.request.url.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Domain filter
    if (filters.domain && filters.domain !== "all" && entry.domain !== filters.domain) {
      return false;
    }

    // Method filter
    if (filters.method && filters.method !== "all" && entry.request.method !== filters.method) {
      return false;
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      const statusCode = entry.response.status;
      const statusRange = filters.status;

      if (statusRange === "2xx" && (statusCode < 200 || statusCode >= 300)) return false;
      if (statusRange === "3xx" && (statusCode < 300 || statusCode >= 400)) return false;
      if (statusRange === "4xx" && (statusCode < 400 || statusCode >= 500)) return false;
      if (statusRange === "5xx" && statusCode < 500) return false;
    }

    // Resource type filter
    if (filters.resourceType && filters.resourceType !== "all") {
      if (filters.resourceType.toLowerCase() === "graphql") {
        // For GraphQL filter, check if the entry is a GraphQL request
        if (!entry.isGraphQL) {
          return false;
        }
      } else {
        // For other resource types, use the normal check
        const resourceType = getResourceType(
          entry.response.content.mimeType,
          entry.request.url,
          entry.isGraphQL
        );
        if (resourceType.toLowerCase() !== filters.resourceType.toLowerCase()) {
          return false;
        }
      }
    }

    return true;
  });
}

export function sortEntries(
  entries: NetworkEntry[],
  sortField: string,
  sortDirection: "asc" | "desc"
): NetworkEntry[] {
  return [...entries].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "url":
        aValue = a.request.url;
        bValue = b.request.url;
        break;
      case "method":
        aValue = a.request.method;
        bValue = b.request.method;
        break;
      case "status":
        aValue = a.response.status;
        bValue = b.response.status;
        break;
      case "size":
        aValue = a.size;
        bValue = b.size;
        break;
      case "time":
        aValue = a.duration;
        bValue = b.duration;
        break;
      case "domain":
        aValue = a.domain;
        bValue = b.domain;
        break;
      default:
        aValue = a.startedDateTime;
        bValue = b.startedDateTime;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
}

export function calculateSummaryStats(entries: NetworkEntry[]) {
  const totalRequests = entries.length;
  const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
  const totalTransferred = entries.reduce((sum, entry) => sum + (entry.transferred || 0), 0);
  const averageTime =
    entries.length > 0
      ? entries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / entries.length
      : 0;

  const statusCounts = entries.reduce(
    (acc, entry) => {
      const status = Math.floor(entry.response.status / 100) * 100;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const methodCounts = entries.reduce(
    (acc, entry) => {
      acc[entry.request.method] = (acc[entry.request.method] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalRequests,
    totalSize,
    totalTransferred,
    averageTime,
    statusCounts,
    methodCounts,
  };
}

// GraphQL related utilities
export function isGraphQLRequest(entry: NetworkEntry): boolean {
  // Check for GraphQL endpoint in URL
  const isGraphQLEndpoint =
    entry.request.url.includes("/graphql") || entry.request.url.includes("/api/graphql");

  // Check for GraphQL content type
  const hasGraphQLContentType = entry.request.headers.some(
    h =>
      h.name.toLowerCase() === "content-type" &&
      h.value.toLowerCase().includes("application/graphql")
  );

  // Check if request body looks like GraphQL
  const hasGraphQLBody = entry.request.postData?.text
    ? entry.request.postData.text.includes('"query"') ||
      entry.request.postData.text.includes('"mutation"') ||
      entry.request.postData.text.includes('"subscription"')
    : false;

  return isGraphQLEndpoint || hasGraphQLContentType || hasGraphQLBody;
}

export function parseGraphQLOperation(entry: NetworkEntry) {
  if (!entry.request.postData?.text) {
    return null;
  }

  try {
    let jsonData;
    try {
      // Most GraphQL APIs use JSON for the request body
      jsonData = JSON.parse(entry.request.postData.text);
    } catch {
      // If not valid JSON, return null
      return null;
    }

    // If this doesn't look like a GraphQL request, return null
    if (!jsonData.query) {
      return null;
    }

    // Determine operation type and name by parsing the query
    let operationType = "unknown";
    let operationName = jsonData.operationName || null;

    // Simple regex to determine the operation type
    const queryMatch = jsonData.query.match(/^\s*(query|mutation|subscription)\s+([A-Za-z0-9_]+)?/);
    if (queryMatch) {
      operationType = queryMatch[1] as "query" | "mutation" | "subscription";
      if (!operationName && queryMatch[2]) {
        operationName = queryMatch[2];
      }
    } else if (jsonData.query.trim().startsWith("{")) {
      // If query starts with { and no operation type is specified, it's a query
      operationType = "query";
    }

    return {
      operationType,
      operationName,
      query: jsonData.query,
      variables: jsonData.variables || null,
    };
  } catch (error) {
    console.error("Error parsing GraphQL operation:", error);
    return null;
  }
}

export function parseGraphQLResponse(entry: NetworkEntry) {
  if (!entry.response.content?.text) {
    return null;
  }

  try {
    const responseText = entry.response.content.text;
    const responseJson = JSON.parse(responseText);

    // Check if it has the structure of a GraphQL response (data and/or errors field)
    if (Object.hasOwn(responseJson, "data") || Object.hasOwn(responseJson, "errors")) {
      return responseJson as { data?: any; errors?: any[] };
    }

    return null;
  } catch (error) {
    console.error("Error parsing GraphQL response:", error);
    return null;
  }
}
