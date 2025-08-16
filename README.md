# Devbox

<p align="center">
  <img src="public/logo.png" alt="Devbox Logo" width="120" height="120">
</p>

<p align="center"><strong>All your everyday developer tools in one fast desktop app</strong></p>
<p align="center">Devbox is a lightweight, cross‑platform desktop and web app built with Tauri (Rust) and React that bundles everyday developer utilities into a single, streamlined experience. No clutter, no browser tabs — just the tools you need, available offline and optimized for productivity.</p>

<p align="center">
  <img src="public/appscreenshot.png" width="800px" alt="Devbox Screenshot">
</p>

### Overview

Devbox helps you work faster by centralizing common developer workflows: inspect JWTs, test REST and GraphQL APIs, format JSON, explore regex, decode certificates, parse cron, and more. The dashboard surfaces frequently used tools and lets you customize the sidebar so your favorites are one click away.

### Highlights

- **Cross‑platform desktop**: Powered by Tauri for a small footprint and native performance.
- **Web app**: Use it in the browser with a fast Vite dev server and static build.
- **Productivity‑first UI**: Group and reorder tools, hide what you don’t use, and get to work quickly.
- **Dashboard**: See recently used tools and follow your own RSS feeds.
- **Offline‑friendly**: Most tools work entirely locally; network tools only connect when you use them.
- **No fluff**: Purpose‑built tools with sensible defaults.

### Currently Available Tools

- **Authentication & Security**: JWT Inspector, HMAC Generator, X.509 Certificate Decoder
- **Data & Formats**: JSON Formatter, Backslash Escape/Unescape, URL Parser, URL Encoder, EPOCH Converter, Timezone
- **Networking**: REST Client, GraphiQL Client, HAR Viewer, DNS Lookup, SSH Key tools
- **Dev Utilities**: Regex Tester, Cron Builder & Parser, ID Generators, SVG Viewer, Bundle Analyzer

> Installation and downloads will be added after the first public release.

## Getting Started

### Desktop (Tauri)

1. Install dependencies:

```bash
  yarn install
```

2. Start the desktop app:

```bash
  yarn start
```

Access app from the browser at `http://localhost:3001`

## Build

### Static web build

```bash
  yarn build
```

### Desktop (Tauri) build

```bash
  yarn tauri build
```

## Roadmap

### Features

- [x] Move tool position
- [x] Quick access icon on menu
- [x] Grouped tools
- [x] Hide/Unhide tools
- [x] Dashboard
  - [x] Frequently used tools
  - [x] Add Custom RSS Feed
- [ ] Smart clipboard

### Tools

- [x] JWT
- [x] Markdown
- [x] SVG
- [x] Cron
- [x] ID Generator
- [x] Regex Tester
- [x] Bundle Analyzer
- [x] SSH
- [x] HAR Viewer
- [x] REST API Testing
- [x] GraphiQL
- [x] EPOCH Converter
- [x] URL Parser
- [x] URL Encoder
- [x] HMAC Generator
- [x] Backslash Escape/Unescape
- [x] DNS Lookup Tool
- [x] Certificate Decoder X.509
- [x] JSON Formatter
- [x] Timezone
- [x] Diff tools
- [x] Base64 Text (encode/decode)
- [x] HTM/CSS Preview
- [x] JSON <> YAML
- [x] Hashing Text
- [x] Quick Type
- [x] SQL Formatter
- [x] HTML Formatter
- [x] CSS Formatter
- [x] JS/TS Formatter
- [x] Stateless password
- [x] Data Faker
- [ ] WebSocket Client
- [ ] Mock API Server / Webhook test

## Contributing

We welcome contributions! Issues for bugs, UX polish, or new tools are all appreciated. Development setup and installation documentation will be added alongside the initial release.
