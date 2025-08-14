import { isTauri } from "@/utils/isTauri";
import { settingsStore } from "@/utils/store";
import { invoke } from "@tauri-apps/api/core";
import { XMLParser } from "fast-xml-parser";
import { useCallback, useEffect, useState } from "react";

type Feed = { id: string; url: string; title?: string; enabled: boolean; addedAt: number };
type FeedItem = {
  title: string;
  link: string;
  published: string;
  publishedRelative: string;
  source: string;
  description?: string;
  sourceIconUrl?: string;
  previewImageUrl?: string;
};

const DEFAULT_FEEDS: Omit<Feed, "id" | "addedAt">[] = [
  { url: "https://engineering.atspotify.com/feed", title: "Spotify", enabled: true },
  { url: "https://medium.com/feed/better-programming", title: "Better Programming", enabled: true },
  { url: "https://blog.cloudflare.com/rss/", title: "Cloudflare Blog", enabled: true },
  { url: "https://overreacted.io/rss.xml", title: "Overreacted", enabled: true },
  { url: "https://rss.beehiiv.com/feeds/ypr2bi0H9m.xml", title: "Hungry Minds", enabled: true },
  {
    url: "https://www.thecrazyprogrammer.com/category/programming/feed",
    title: "The Crazy Programmer",
    enabled: true,
  },
];

function toRelativeTime(dateStr: string): string {
  const ts = new Date(dateStr).getTime();
  if (Number.isNaN(ts)) return "";
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useRssFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cacheKey, setCacheKey] = useState(0);

  const seedDefaults = useCallback(async () => {
    const saved = (await settingsStore.getTyped("rssFeeds")) || [];
    if (saved.length === 0) {
      const seeded: Feed[] = DEFAULT_FEEDS.map(df => ({
        id: `${df.url}`,
        url: df.url,
        title: df.title,
        enabled: df.enabled,
        addedAt: Date.now(),
      }));
      await settingsStore.updateTyped("rssFeeds", seeded);
      setFeeds(seeded);
    } else {
      setFeeds(saved);
    }
  }, []);

  const parseRss = useCallback(async (url: string, force: boolean = false): Promise<FeedItem[]> => {
    try {
      let text: string | undefined;
      if (isTauri()) {
        text = await invoke<string>("fetch_rss", { url, force });
      } else {
        // Web: try direct fetch, then optional proxy fallback via VITE_RSS_PROXY
        try {
          // Try cache first
          const cacheKey = `rss:${url}`;
          const cached = force ? null : sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached) as { at: number; body: string };
            const fresh = Date.now() - parsed.at < 30 * 60 * 1000; // 30 minutes
            if (fresh) {
              text = parsed.body;
              // fall through to parse
            } else {
              sessionStorage.removeItem(cacheKey);
            }
          }

          if (!text) {
            const proxy =
              (import.meta.env.VITE_RSS_PROXY as string | undefined) ||
              "https://cors-anywhere.com/{url}";
            const proxied = proxy.includes("{url}")
              ? proxy.replace("{url}", url)
              : `${proxy}?url=${encodeURIComponent(url)}`;
            const cacheKey = `rss:${proxied}`;
            const cached = force ? null : sessionStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached) as { at: number; body: string };
              const fresh = Date.now() - parsed.at < 30 * 60 * 1000;
              if (fresh) {
                text = parsed.body;
              } else {
                sessionStorage.removeItem(cacheKey);
              }
            }
            if (!text) {
              const res = await fetch(proxied);
              text = await res.text();
              if (!force) {
                sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), body: text }));
              }
            }
          }
        } catch (_err) {
          const proxy =
            (import.meta.env.VITE_RSS_PROXY as string | undefined) ||
            "https://cors-anywhere.com/{url}";
          const proxied = proxy.includes("{url}")
            ? proxy.replace("{url}", url)
            : `${proxy}?url=${encodeURIComponent(url)}`;
          const cacheKey = `rss:${proxied}`;
          const cached = force ? null : sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached) as { at: number; body: string };
            const fresh = Date.now() - parsed.at < 30 * 60 * 1000;
            if (fresh) {
              text = parsed.body;
            } else {
              sessionStorage.removeItem(cacheKey);
            }
          }
          if (!text) {
            const res = await fetch(proxied);
            text = await res.text();
            if (!force) {
              sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), body: text }));
            }
          }
        }
      }
      let entries: FeedItem[] = [];
      if ((!entries || entries.length === 0) && text) {
        try {
          const fx = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
          const xml = fx.parse(text);
          const isRss = !!xml.rss || !!xml.channel;
          const isAtom = !!xml.feed;
          const source =
            (isRss ? xml.rss?.channel?.title || xml.channel?.title : xml.feed?.title) ||
            new URL(url).host;
          const feedIcon: string | undefined = isRss
            ? xml.rss?.channel?.image?.url || xml.channel?.image?.url
            : xml.feed?.icon || xml.feed?.logo;
          const items = isRss
            ? xml.rss?.channel?.item || xml.channel?.item || []
            : xml.feed?.entry || [];
          const arr = Array.isArray(items) ? items : [items];
          entries = arr.slice(0, 24).map((node: any) => {
            const link = isAtom ? node.link?.["@_href"] || node.link : node.link;
            const published =
              node.pubDate || node.updated || node.published || new Date().toISOString();
            const raw =
              node["content:encoded"] || node.content || node.summary || node.description || "";
            const mediaThumb =
              node["media:thumbnail"]?.["@_url"] || node["media:content"]?.["@_url"];
            const enclosureUrl =
              typeof node.enclosure === "object" ? node.enclosure?.["@_url"] : undefined;
            const title = node.title || "Untitled";
            return {
              title: String(title),
              link: typeof link === "string" ? link : link || url,
              published: String(published),
              source: String(source),
              description: String(raw).replace(/\s+/g, " ").trim(),
              publishedRelative: "",
              sourceIconUrl: typeof feedIcon === "string" ? feedIcon : undefined,
              previewImageUrl: (mediaThumb as string) || (enclosureUrl as string) || undefined,
            } as FeedItem;
          });
        } catch (_err) {
          // ignore
        }
      }
      return entries.map(e => ({ ...e, publishedRelative: toRelativeTime(e.published) }));
    } catch (_err) {
      console.error(_err);
      throw _err;
    }
  }, []);

  const refreshAll = useCallback(
    async (force: boolean = false) => {
      setLoading(true);
      try {
        const enabledFeeds = feeds.filter(f => f.enabled);
        const results = await Promise.all(enabledFeeds.map(f => parseRss(f.url, force)));
        const flat = results
          .flat()
          .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
        setItems(flat);
      } finally {
        setLoading(false);
      }
    },
    [feeds, parseRss, cacheKey]
  );

  const addFeed = useCallback(
    async (url: string, label?: string) => {
      try {
        const normalized = url.trim();
        const exists = feeds.find(f => f.url === normalized);
        if (exists) return;
        const next: Feed = {
          id: normalized,
          url: normalized,
          enabled: true,
          title: label || undefined,
          addedAt: Date.now(),
        };
        const updated = [next, ...feeds];
        await settingsStore.updateTyped("rssFeeds", updated);
        setFeeds(updated);
        // Force refetch after adding a feed
        setCacheKey(prev => prev + 1);
        await refreshAll(true);
      } catch (_err) {
        // ignore
      }
    },
    [feeds, refreshAll]
  );

  const toggleFeed = useCallback(
    async (id: string) => {
      const updated = feeds.map(f => (f.id === id ? { ...f, enabled: !f.enabled } : f));
      await settingsStore.updateTyped("rssFeeds", updated);
      setFeeds(updated);
      setCacheKey(prev => prev + 1);
    },
    [feeds]
  );

  const removeFeed = useCallback(
    async (id: string) => {
      const updated = feeds.filter(f => f.id !== id);
      await settingsStore.updateTyped("rssFeeds", updated);
      setFeeds(updated);
    },
    [feeds]
  );

  useEffect(() => {
    seedDefaults();
  }, [seedDefaults]);

  useEffect(() => {
    if (feeds.length) refreshAll();
  }, [feeds, refreshAll]);

  return { feeds, items, addFeed, removeFeed, toggleFeed, refreshAll, loading };
}
