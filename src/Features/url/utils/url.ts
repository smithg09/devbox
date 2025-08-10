export type ParsedUrl = {
  scheme: string;
  username?: string;
  password?: string;
  hostname: string;
  port?: string;
  path?: string;
  hash?: string;
  query: string;
};

export function parseUrl(input: string): ParsedUrl | { error: string } {
  try {
    const u = new URL(input);
    return {
      scheme: u.protocol.replace(":", ""),
      username: u.username || undefined,
      password: u.password || undefined,
      hostname: u.hostname,
      port: u.port || undefined,
      path: u.pathname || undefined,
      hash: u.hash ? u.hash.replace(/^#/, "") : undefined,
      query: u.search ? u.search.replace(/^\?/, "") : "",
    };
  } catch (e) {
    return { error: (e as Error).message || "Invalid URL" };
  }
}

export function buildUrl(parts: {
  scheme: string;
  username?: string;
  password?: string;
  hostname: string;
  port?: string;
  path?: string;
  hash?: string;
  query?: string;
}): string {
  const auth =
    parts.username || parts.password
      ? `${parts.username || ""}${parts.password ? ":" + parts.password : ""}@`
      : "";
  const port = parts.port ? `:${parts.port}` : "";
  const path = parts.path?.startsWith("/") ? parts.path : parts.path ? `/${parts.path}` : "";
  const hash = parts.hash ? `#${parts.hash}` : "";
  const query = parts.query ? `?${parts.query}` : "";
  const scheme = parts.scheme ? `${parts.scheme}:` : "";
  return `${scheme}//${auth}${parts.hostname}${port}${path}${query}${hash}`;
}

export type Pair = { key: string; value: string };

export function parseQuery(raw: string): Pair[] {
  if (!raw) return [];
  return raw.split("&").map(seg => {
    const [k, v = ""] = seg.split("=");
    return {
      key: decodeURIComponentSafe(k),
      value: decodeURIComponentSafe(v.replace(/\+/g, "%20")),
    };
  });
}

export function stringifyQuery(
  items: { key: string; value: string }[],
  opts?: { formUrlEncoded?: boolean }
): string {
  const enc = (s: string) =>
    encodeURIComponent(s).replace(
      /[!'()\*]/g,
      c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );
  return items
    .map(({ key, value }) => {
      const k = enc(key);
      const v = enc(value);
      const val = opts?.formUrlEncoded ? v.replace(/%20/g, "+") : v;
      return `${k}=${val}`;
    })
    .join("&");
}

export function toJsonMulti(
  items: { key: string; value: string }[]
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const { key, value } of items) {
    if (Object.prototype.hasOwnProperty.call(out, key)) {
      const existing = out[key];
      if (Array.isArray(existing)) existing.push(value);
      else out[key] = [existing, value];
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function decodeAuto(input: string, opts?: { plusAsSpace?: boolean }): string {
  const prepared = opts?.plusAsSpace ? input.replace(/\+/g, "%20") : input;
  return decodeURIComponentSafe(prepared);
}

export function encodeUriComponentStrict(input: string): string {
  return encodeURIComponent(input).replace(
    /[!'()\*]/g,
    c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

export function encodeUri(input: string): string {
  return encodeURI(input);
}

export function encodeFormUrlencoded(input: string): string {
  return encodeUriComponentStrict(input).replace(/%20/g, "+");
}

export function encodeRFC3986Strict(input: string): string {
  return encodeURIComponent(input).replace(
    /[!'()\*]/g,
    c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function decodeURIComponentSafe(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch (e) {
    // try to decode piecemeal; leave invalid sequences as-is
    return input;
  }
}
