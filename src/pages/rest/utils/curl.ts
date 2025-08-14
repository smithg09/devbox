import { HttpMethod, KeyValue, RequestBody } from "../types/rest";

export function toCurl(args: {
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  body: RequestBody;
}): string {
  const { method, url, headers, body } = args;
  const headerFlags = headers
    .filter(h => h.enabled && h.key)
    .map(h => `-H ${JSON.stringify(`${h.key}: ${h.value}`)}`)
    .join(" ");

  let data = "";
  if (body.mode === "json" || body.mode === "xml" || body.mode === "text") {
    data = `--data ${JSON.stringify(body.text ?? "")}`;
  } else if (body.mode === "form") {
    // repeat -d for each field to support same key
    data = body.fields
      .filter(f => f.enabled && f.key)
      .map(f => `-d ${JSON.stringify(`${f.key}=${f.value}`)}`)
      .join(" ");
  } else if (body.mode === "multipart") {
    data = body.fields
      .filter(f => f.enabled && f.key)
      .map(f => `-F ${JSON.stringify(`${f.key}=${f.value}`)}`)
      .join(" ");
  }

  const parts = ["curl", "-X", method, headerFlags, data, JSON.stringify(url)]
    .filter(Boolean)
    .join(" ");
  return parts;
}

export type ParsedCurl = {
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  body: RequestBody;
};

// Minimal curl parser for common flags
export function parseCurl(input: string): ParsedCurl | null {
  if (!/^\s*curl\s+/i.test(input)) return null;
  const tokens = input.replace(/\\\n/g, " ").match(/\"[^\"]*\"|'[^']*'|[^\s]+/g) || [];

  let method: HttpMethod = "GET";
  const headers: KeyValue[] = [];
  let url = "";
  let bodyText = "";

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const plain = t.replace(/^['\"]|['\"]$/g, "");
    switch (plain) {
      case "-X":
      case "--request":
        method = (tokens[++i]?.replace(/^['\"]|['\"]$/g, "") as HttpMethod) || "GET";
        break;
      case "-H":
      case "--header": {
        const hv = tokens[++i]?.replace(/^['\"]|['\"]$/g, "") || "";
        const [k, ...rest] = hv.split(":");
        headers.push({
          id: crypto.randomUUID(),
          key: k.trim(),
          value: rest.join(":").trim(),
          enabled: true,
        });
        break;
      }
      case "-d":
      case "--data":
      case "--data-raw": {
        bodyText = tokens[++i]?.replace(/^['\"]|['\"]$/g, "") || "";
        if (method === "GET") method = "POST";
        break;
      }
      default:
        if (/^https?:\/\//.test(plain)) url = plain;
        break;
    }
  }

  const body: RequestBody = bodyText ? { mode: "text", text: bodyText } : { mode: "none" };

  return { method, url, headers, body };
}
