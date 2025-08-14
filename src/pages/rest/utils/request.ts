import { BodyMode, HttpMethod, KeyValue, RequestBody, RestResponse } from "../types/rest";

function buildQueryString(params: KeyValue[]): string {
  const usp = new URLSearchParams();
  params.filter(p => p.enabled && p.key).forEach(p => usp.append(p.key, p.value));
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export function buildUrlWithParams(url: string, params: KeyValue[]): string {
  try {
    const u = new URL(url);
    params.filter(p => p.enabled && p.key).forEach(p => u.searchParams.set(p.key, p.value));
    return u.toString();
  } catch {
    // Fallback if not absolute URL yet, append naive query
    const qs = buildQueryString(params);
    if (!qs) return url;
    return url.includes("?") ? `${url}&${qs.slice(1)}` : `${url}${qs}`;
  }
}

export function kvToRecord(list: KeyValue[]): Record<string, string> {
  return list
    .filter(h => h.enabled && h.key)
    .reduce<Record<string, string>>((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
}

export function buildBody(body: RequestBody): BodyInit | undefined {
  if (body.mode === "none") return undefined;
  if (body.mode === "json" || body.mode === "xml" || body.mode === "text") {
    return body.text ?? "";
  }
  if (body.mode === "form") {
    const usp = new URLSearchParams();
    body.fields.filter(f => f.enabled && f.key).forEach(f => usp.append(f.key, f.value));
    return usp as unknown as BodyInit;
  }
  if (body.mode === "multipart") {
    const fd = new FormData();
    body.fields.filter(f => f.enabled && f.key).forEach(f => fd.append(f.key, f.value));
    // Files: path resolution can be handled later with Tauri FS/Open dialog
    body.files?.forEach(file => {
      if (file.field && file.name) {
        // Placeholder: append empty Blob; actual file picking wired in UI
        fd.append(file.field, new Blob([""]), file.name);
      }
    });
    return fd as unknown as BodyInit;
  }
  return undefined;
}

export async function sendRequest(args: {
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  body: RequestBody;
  signal?: AbortSignal;
}): Promise<RestResponse> {
  const { method, url, params, headers, body, signal } = args;
  const paramList = [...params];
  const headerList = [...headers];

  const finalUrl = buildUrlWithParams(url, paramList);
  const headerRecord = kvToRecord(headerList);

  // Auto content-type for textual body if not provided
  const contentType = Object.keys(headerRecord).find(k => k.toLowerCase() === "content-type");
  const hasContentType = Boolean(contentType);
  const isTextual: BodyMode[] = ["json", "xml", "text"];
  const shouldSetContentType = !hasContentType && isTextual.includes(body.mode);
  if (shouldSetContentType) {
    headerRecord["Content-Type"] =
      body.mode === "json"
        ? "application/json"
        : body.mode === "xml"
          ? "application/xml"
          : "text/plain";
  }

  const init: RequestInit = {
    method,
    headers: headerRecord,
    body: method === "GET" || method === "HEAD" ? undefined : buildBody(body),
    signal,
  };

  const t1 = performance.now();
  const res = await fetch(finalUrl, init);
  const t2 = performance.now();

  const headersObj: Record<string, string> = {};
  res.headers.forEach((v, k) => (headersObj[k] = v));

  const contentTypeHeader = res.headers.get("content-type") || "";
  const isJson = contentTypeHeader.includes("application/json");
  const isHtml = contentTypeHeader.includes("text/html");
  const isText = contentTypeHeader.includes("text/") || contentTypeHeader.includes("xml");

  let bodyObj: RestResponse["body"] = { kind: "text", text: "" };
  try {
    if (isJson) {
      bodyObj = { kind: "json", json: await res.json() };
    } else if (isHtml) {
      bodyObj = { kind: "html", text: await res.text() };
    } else if (isText) {
      bodyObj = { kind: "text", text: await res.text() };
    } else {
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      bytes.forEach(b => (binary += String.fromCharCode(b)));
      bodyObj = { kind: "binary", bytesBase64: btoa(binary) };
    }
  } catch (e) {
    bodyObj = { kind: "text", text: await res.text().catch(() => "") };
  }

  return {
    status: res.status,
    statusText: res.statusText,
    timeMs: t2 - t1,
    headers: headersObj,
    body: bodyObj,
  };
}
