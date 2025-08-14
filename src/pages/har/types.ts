// HAR (HTTP Archive) format types
export interface HarFile {
  log: HarLog;
}

export interface HarLog {
  version: string;
  creator: HarCreator;
  browser?: HarCreator;
  pages?: HarPage[];
  entries: HarEntry[];
  comment?: string;
}

export interface HarCreator {
  name: string;
  version: string;
  comment?: string;
}

export interface HarPage {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings: HarPageTimings;
  comment?: string;
}

export interface HarPageTimings {
  onContentLoad?: number;
  onLoad?: number;
  comment?: string;
}

export interface HarEntry {
  pageref?: string;
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  cache: HarCache;
  timings: HarTimings;
  serverIPAddress?: string;
  connection?: string;
  comment?: string;
}

export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  cookies: HarCookie[];
  headers: HarHeader[];
  queryString: HarQueryParam[];
  postData?: HarPostData;
  headersSize: number;
  bodySize: number;
  comment?: string;
}

export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  cookies: HarCookie[];
  headers: HarHeader[];
  content: HarContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
  comment?: string;
}

export interface HarHeader {
  name: string;
  value: string;
  comment?: string;
}

export interface HarCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  comment?: string;
}

export interface HarQueryParam {
  name: string;
  value: string;
  comment?: string;
}

export interface HarPostData {
  mimeType: string;
  params?: HarParam[];
  text?: string;
  comment?: string;
}

export interface HarParam {
  name: string;
  value?: string;
  fileName?: string;
  contentType?: string;
  comment?: string;
}

export interface HarContent {
  size: number;
  compression?: number;
  mimeType: string;
  text?: string;
  encoding?: string;
  comment?: string;
}

export interface HarCache {
  beforeRequest?: HarCacheEntry;
  afterRequest?: HarCacheEntry;
  comment?: string;
}

export interface HarCacheEntry {
  expires?: string;
  lastAccess: string;
  eTag: string;
  hitCount: number;
  comment?: string;
}

export interface HarTimings {
  blocked?: number;
  dns?: number;
  connect?: number;
  send: number;
  wait: number;
  receive: number;
  ssl?: number;
  comment?: string;
}

// Additional types for the viewer
export interface NetworkEntry extends HarEntry {
  id: string;
  domain: string;
  path: string;
  size: number;
  transferred: number;
  duration: number;
  statusColor: string;
  initiator?: string;
  isGraphQL?: boolean;
}

export interface FilterOptions {
  search: string;
  domain: string;
  method: string;
  status: string;
  resourceType: string;
  hasResponse: boolean;
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

// Network Dependency Graph Types
export interface NetworkDependency {
  from: string; // entry id
  to: string; // entry id
  type: "initiator" | "redirect" | "resource" | "xhr";
  strength: number; // 0-1, how strong the dependency is
}

export interface DependencyNode {
  id: string;
  entry: NetworkEntry;
  dependencies: NetworkDependency[];
  level: number; // depth in dependency tree
  x: number;
  y: number;
}

// Performance Timeline Types
export interface PerformanceMilestone {
  name: string;
  time: number;
  type: "navigation" | "paint" | "load" | "user" | "custom";
  description?: string;
  color: string;
}

export interface CriticalPath {
  entries: NetworkEntry[];
  totalTime: number;
  bottlenecks: Array<{
    entry: NetworkEntry;
    issue: string;
    impact: "high" | "medium" | "low";
  }>;
}

// Heatmap Types
export interface HeatmapData {
  timeSlots: Array<{
    start: number;
    end: number;
    intensity: number; // 0-1
    requests: NetworkEntry[];
  }>;
  maxConcurrency: number;
}
