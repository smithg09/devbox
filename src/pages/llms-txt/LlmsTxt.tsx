import {
  Button,
  Code,
  CopyButton,
  Group,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { saveDataToFile } from "@/utils/functions";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { BsCheck, BsCopy, BsDownload, BsFiletypeDoc } from "react-icons/bs";

interface PageMeta {
  url: string;
  title: string;
  description: string;
  content: string;
}

function buildLlmsTxt(pages: PageMeta[]): string {
  const lines: string[] = [];
  if (pages.length > 0) {
    const first = pages[0];
    lines.push(`# ${first.title || new URL(first.url).hostname}`);
    if (first.description) lines.push(`\n> ${first.description}`);
    lines.push("");
  }
  lines.push("## Pages");
  lines.push("");
  for (const p of pages) {
    lines.push(`- [${p.title || p.url}](${p.url})${p.description ? `: ${p.description}` : ""}`);
  }
  return lines.join("\n");
}

function buildLlmsFullTxt(pages: PageMeta[]): string {
  const lines: string[] = [];
  for (const p of pages) {
    lines.push(`# ${p.title || p.url}`);
    lines.push(`URL: ${p.url}`);
    if (p.description) lines.push(`Description: ${p.description}`);
    lines.push("");
    lines.push(p.content || "(no content extracted)");
    lines.push("\n---\n");
  }
  return lines.join("\n");
}

function buildFromContent(raw: string): { llms: string; full: string } {
  const sections = raw
    .split(/\n#{1,3} /)
    .map(s => s.trim())
    .filter(Boolean);
  const llmsLines = ["# Document", "", "## Sections", ""];
  for (const s of sections) {
    const firstLine = s.split("\n")[0].trim();
    llmsLines.push(`- ${firstLine}`);
  }
  const fullLines = ["# Full Document", "", raw];
  return { llms: llmsLines.join("\n"), full: fullLines.join("\n") };
}

async function fetchPageMeta(url: string): Promise<PageMeta> {
  try {
    const html = await invoke<string>("fetch_url", { url });
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const title = doc.querySelector("title")?.textContent?.trim() ?? url;
    const description =
      doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ??
      doc.querySelector('meta[property="og:description"]')?.getAttribute("content")?.trim() ??
      "";
    const content = doc.body?.innerText?.slice(0, 4000) ?? "";
    return { url, title, description, content };
  } catch {
    return { url, title: url, description: "(fetch failed)", content: "" };
  }
}

export default function LlmsTxt() {
  const [inputTab, setInputTab] = useState<string>("urls");
  const [urlsText, setUrlsText] = useState(
    "https://example.com\nhttps://example.com/docs\nhttps://example.com/api"
  );
  const [rawContent, setRawContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [llmsTxt, setLlmsTxt] = useState("");
  const [llmsFullTxt, setLlmsFullTxt] = useState("");
  const [outputTab, setOutputTab] = useState("llms");

  const generate = async () => {
    setLoading(true);
    try {
      if (inputTab === "urls") {
        const urls = urlsText
          .split("\n")
          .map(u => u.trim())
          .filter(u => u.startsWith("http"));
        const pages = await Promise.all(urls.map(fetchPageMeta));
        setLlmsTxt(buildLlmsTxt(pages));
        setLlmsFullTxt(buildLlmsFullTxt(pages));
      } else {
        const { llms, full } = buildFromContent(rawContent);
        setLlmsTxt(llms);
        setLlmsFullTxt(full);
      }
    } finally {
      setLoading(false);
    }
  };

  const download = async (content: string, filename: string) => {
    const ext = filename.split(".").pop() || "txt";
    await saveDataToFile(content, `Save ${filename}`, [{ name: "Text File", extensions: [ext] }]);
  };

  const activeOutput = outputTab === "llms" ? llmsTxt : llmsFullTxt;
  const activeFilename = outputTab === "llms" ? "llms.txt" : "llms-full.txt";

  return (
    <Stack className="overflow-padding" h="100%" gap="sm">
      <Group gap="xs">
        <BsFiletypeDoc size={18} />
        <Title order={4}>llms.txt Generator</Title>
      </Group>
      <Text size="sm" c="dimmed">
        Generate structured <Code>llms.txt</Code> and <Code>llms-full.txt</Code> files — the
        emerging standard for making sites AI-readable.
      </Text>

      <Group align="start" h="100%" gap="md" wrap="nowrap" style={{ flex: 1, overflow: "hidden" }}>
        <Stack w={360} gap="sm" style={{ flexShrink: 0 }}>
          <Tabs value={inputTab} onChange={v => setInputTab(v ?? "urls")}>
            <Tabs.List>
              <Tabs.Tab value="urls">URLs</Tabs.Tab>
              <Tabs.Tab value="content">Paste Content</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="urls" pt="sm">
              <Textarea
                value={urlsText}
                onChange={e => setUrlsText(e.currentTarget.value)}
                placeholder="One URL per line&#10;https://example.com&#10;https://example.com/docs"
                styles={{
                  input: {
                    fontFamily: "monospace",
                    fontSize: 12,
                    resize: "none",
                    overflowY: "auto",
                    height: "17rem",
                    minHeight: "17rem",
                  },
                }}
              />
              <Text size="xs" c="dimmed" mt={4}>
                Content is fetched natively. For large sites, paste content directly instead.
              </Text>
            </Tabs.Panel>
            <Tabs.Panel value="content" pt="sm">
              <Textarea
                value={rawContent}
                onChange={e => setRawContent(e.currentTarget.value)}
                placeholder="Paste your site's content, documentation, or README here..."
                styles={{
                  input: {
                    fontFamily: "monospace",
                    fontSize: 12,
                    resize: "none",
                    overflowY: "auto",
                    height: "17rem",
                    minHeight: "17rem",
                  },
                }}
              />
            </Tabs.Panel>
          </Tabs>
          <Button size="sm" variant="filled" loading={loading} onClick={generate}>
            Generate
          </Button>
        </Stack>

        <Stack style={{ flex: 1, height: "100%" }} gap="sm">
          {activeOutput ? (
            <>
              <Tabs value={outputTab} onChange={v => setOutputTab(v ?? "llms")}>
                <Tabs.List>
                  <Tabs.Tab value="llms">llms.txt</Tabs.Tab>
                  <Tabs.Tab value="full">llms-full.txt</Tabs.Tab>
                </Tabs.List>
              </Tabs>
              <Group gap="xs">
                <CopyButton value={activeOutput}>
                  {({ copied, copy }) => (
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={copied ? <BsCheck size={12} /> : <BsCopy size={12} />}
                      onClick={copy}
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  )}
                </CopyButton>
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<BsDownload size={12} />}
                  onClick={() => download(activeOutput, activeFilename)}
                >
                  Download {activeFilename}
                </Button>
              </Group>
              <ScrollArea style={{ flex: 1 }}>
                <Code block style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
                  {activeOutput}
                </Code>
              </ScrollArea>
            </>
          ) : (
            <Text size="sm" c="dimmed" ta="center" mt="xl">
              Enter URLs or paste content and click Generate
            </Text>
          )}
        </Stack>
      </Group>
    </Stack>
  );
}
