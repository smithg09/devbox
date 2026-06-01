import {
  Alert,
  Badge,
  Box,
  Button,
  Code,
  CopyButton,
  Divider,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { BsCheck, BsCopy, BsExclamationTriangle, BsShieldX } from "react-icons/bs";

interface CorsIssue {
  severity: "error" | "warning";
  explanation: string;
  fix: string;
}

interface CorsResult {
  status: "pass" | "fail";
  issues: CorsIssue[];
  isPreflightRequired: boolean;
  requiredHeaders: string[];
}

function parseHeaders(raw: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    if (key) headers[key] = val;
  }
  return headers;
}

function analyzeCors(requestRaw: string, responseRaw: string): CorsResult {
  const req = parseHeaders(requestRaw);
  const res = parseHeaders(responseRaw);
  const issues: CorsIssue[] = [];
  const requiredHeaders: string[] = [];

  const origin = req["origin"];
  const method = req["access-control-request-method"] || req[":method"] || "GET";
  const requestedHeaders = req["access-control-request-headers"];
  const isPreflightRequired =
    !!req["access-control-request-method"] ||
    ["PUT", "PATCH", "DELETE"].includes(method.toUpperCase()) ||
    !!requestedHeaders;

  const acao = res["access-control-allow-origin"];
  const acam = res["access-control-allow-methods"];
  const acah = res["access-control-allow-headers"];
  const acac = res["access-control-allow-credentials"];

  if (!acao) {
    issues.push({
      severity: "error",
      explanation:
        "The response is missing the Access-Control-Allow-Origin header. This is the most common CORS error — without it, browsers will block the response entirely.",
      fix: `Access-Control-Allow-Origin: ${origin || "*"}`,
    });
    requiredHeaders.push(`Access-Control-Allow-Origin: ${origin || "*"}`);
  } else if (acao !== "*" && origin && acao !== origin) {
    issues.push({
      severity: "error",
      explanation: `The response allows origin "${acao}" but the request came from "${origin}". The browser rejects mismatched origins.`,
      fix: `Access-Control-Allow-Origin: ${origin}`,
    });
    requiredHeaders.push(`Access-Control-Allow-Origin: ${origin}`);
  }

  if (isPreflightRequired && method && acam) {
    const allowed = acam.split(",").map(m => m.trim().toUpperCase());
    if (!allowed.includes(method.toUpperCase()) && !allowed.includes("*")) {
      issues.push({
        severity: "error",
        explanation: `The preflight response allows methods [${acam}] but the request uses "${method}". The browser will block the actual request.`,
        fix: `Access-Control-Allow-Methods: ${method}, OPTIONS`,
      });
      requiredHeaders.push(`Access-Control-Allow-Methods: ${method}, OPTIONS`);
    }
  } else if (isPreflightRequired && !acam) {
    issues.push({
      severity: "error",
      explanation:
        "A preflight (OPTIONS) request was detected but the response is missing Access-Control-Allow-Methods. The browser needs to know which methods are permitted.",
      fix: `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`,
    });
    requiredHeaders.push(`Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`);
  }

  if (requestedHeaders && !acah) {
    issues.push({
      severity: "error",
      explanation: `The request asks permission for custom headers (${requestedHeaders}) but the response is missing Access-Control-Allow-Headers.`,
      fix: `Access-Control-Allow-Headers: ${requestedHeaders}`,
    });
    requiredHeaders.push(`Access-Control-Allow-Headers: ${requestedHeaders}`);
  }

  if (req["cookie"] || req["authorization"]) {
    if (acao === "*") {
      issues.push({
        severity: "error",
        explanation:
          "The request sends credentials (cookies/Authorization header) but the response uses Access-Control-Allow-Origin: *. Browsers disallow wildcard origin when credentials are involved.",
        fix: `Access-Control-Allow-Origin: ${origin || "<your-origin>"}\nAccess-Control-Allow-Credentials: true`,
      });
    } else if (acac !== "true") {
      issues.push({
        severity: "warning",
        explanation:
          "The request appears to include credentials (cookies or Authorization header). Make sure to add Access-Control-Allow-Credentials: true if credentials should be allowed.",
        fix: `Access-Control-Allow-Credentials: true`,
      });
    }
  }

  return {
    status: issues.some(i => i.severity === "error") ? "fail" : "pass",
    issues,
    isPreflightRequired,
    requiredHeaders,
  };
}

const EXAMPLE_REQUEST = `Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type, Authorization`;

const EXAMPLE_RESPONSE = `Content-Type: application/json
X-Powered-By: Express`;

export default function CorsDebugger() {
  const [requestHeaders, setRequestHeaders] = useState(EXAMPLE_REQUEST);
  const [responseHeaders, setResponseHeaders] = useState(EXAMPLE_RESPONSE);
  const [result, setResult] = useState<CorsResult | null>(null);

  const analyze = () => {
    setResult(analyzeCors(requestHeaders, responseHeaders));
  };

  const fixCode = result?.requiredHeaders.join("\n") ?? "";

  return (
    <ScrollArea h="100%" className="overflow-padding">
      <Stack gap="md" maw={900}>
        <Group gap="xs">
          <BsShieldX size={18} />
          <Title order={4}>CORS Debugger</Title>
        </Group>
        <Text size="sm" c="dimmed">
          Paste your request and response headers to get a plain-English explanation of why CORS is
          failing and the exact headers needed to fix it.
        </Text>

        <Group align="start" grow wrap="nowrap" gap="md">
          <Stack gap={4}>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed">
              Request Headers
            </Text>
            <Textarea
              value={requestHeaders}
              onChange={e => setRequestHeaders(e.currentTarget.value)}
              placeholder="Origin: https://app.example.com&#10;Access-Control-Request-Method: POST"
              minRows={8}
              autosize
              styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
            />
          </Stack>
          <Stack gap={4}>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed">
              Response Headers
            </Text>
            <Textarea
              value={responseHeaders}
              onChange={e => setResponseHeaders(e.currentTarget.value)}
              placeholder="Access-Control-Allow-Origin: *&#10;Content-Type: application/json"
              minRows={8}
              autosize
              styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
            />
          </Stack>
        </Group>

        <Button onClick={analyze} variant="filled" size="sm" w="fit-content">
          Analyze CORS
        </Button>

        {result && (
          <Stack gap="md">
            <Divider />
            <Group gap="xs">
              <Badge color={result.status === "pass" ? "green" : "red"} size="lg">
                {result.status === "pass" ? "✓ CORS OK" : "✗ CORS Blocked"}
              </Badge>
              {result.isPreflightRequired && (
                <Badge color="yellow" variant="outline" size="sm">
                  Preflight (OPTIONS) required
                </Badge>
              )}
            </Group>

            {result.status === "pass" && (
              <Alert color="green" title="No CORS issues detected">
                The headers look correct. If you&apos;re still seeing CORS errors, double-check that
                the actual request method and origin exactly match what the server allows.
              </Alert>
            )}

            {result.issues.map((issue, i) => (
              <Paper key={i} withBorder p="md" radius="md">
                <Stack gap="xs">
                  <Group gap="xs">
                    <BsExclamationTriangle
                      size={14}
                      color={
                        issue.severity === "error"
                          ? "var(--mantine-color-red-5)"
                          : "var(--mantine-color-yellow-5)"
                      }
                    />
                    <Text size="sm" fw={600} c={issue.severity === "error" ? "red" : "yellow"}>
                      {issue.severity === "error" ? "Error" : "Warning"}
                    </Text>
                  </Group>
                  <Text size="sm">{issue.explanation}</Text>
                  <Box>
                    <Text size="xs" c="dimmed" mb={4}>
                      Add to response:
                    </Text>
                    <Code block style={{ fontSize: 12 }}>
                      {issue.fix}
                    </Code>
                  </Box>
                </Stack>
              </Paper>
            ))}

            {result.requiredHeaders.length > 0 && (
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={600}>
                    All required response headers
                  </Text>
                  <CopyButton value={fixCode}>
                    {({ copied, copy }) => (
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={copied ? <BsCheck size={12} /> : <BsCopy size={12} />}
                        onClick={copy}
                      >
                        {copied ? "Copied" : "Copy all"}
                      </Button>
                    )}
                  </CopyButton>
                </Group>
                <Code block style={{ fontSize: 12 }}>
                  {fixCode}
                </Code>
              </Paper>
            )}
          </Stack>
        )}
      </Stack>
    </ScrollArea>
  );
}
