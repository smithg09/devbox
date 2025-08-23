export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type KeyValue = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

export type BodyMode = "none" | "json" | "xml" | "text" | "multipart";

export type RequestBody =
  | { mode: "none" }
  | { mode: "json" | "xml" | "text"; text: string }
  | {
      mode: "multipart";
      fields: KeyValue[];
      files: { id: string; field: string; path?: string; name?: string; file?: File }[];
    };

export type RestResponse = {
  status: number;
  statusText: string;
  httpVersion?: string;
  timeMs: number;
  sizeBytes?: number;
  headers: Record<string, string>;
  cookies?: {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: string;
    secure?: boolean;
    httpOnly?: boolean;
  }[];
  body: {
    kind: "json" | "xml" | "text" | "html" | "binary";
    text?: string;
    json?: unknown;
    bytesBase64?: string;
  };
  timeline?: { phase: string; startMs: number; durationMs: number }[];
};

export type RequestTab = {
  id: string;
  title: string;
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  body: RequestBody;
  meta: { dirty: boolean };
  lastResponse?: RestResponse;
  lastError?: string;
};
