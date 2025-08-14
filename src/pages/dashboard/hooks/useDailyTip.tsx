import { MOD_KEY_LABEL } from "@/utils/keyboard";
import { settingsStore } from "@/utils/store";
import { Kbd } from "@mantine/core";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Tip = { id: string; text: string | React.ReactElement };

const mod = MOD_KEY_LABEL;

const TIPS: Tip[] = [
  {
    id: "shortcut-cmdf",
    text: (
      <>
        Press <Kbd>{mod}</Kbd>+<Kbd>F</Kbd> (or <Kbd>/</Kbd>) to open Spotlight search across all
        tools.
      </>
    ),
  },
  {
    id: "sidebar-toggle",
    text: (
      <>
        Toggle the sidebar with <Kbd>{mod}</Kbd>+<Kbd>B</Kbd> to maximize workspace.
      </>
    ),
  },
  {
    id: "drag-reorder-tools",
    text: "Drag tools in the sidebar to reorder them; your layout is saved.",
  },
  {
    id: "dashboard-rss",
    text: "Add RSS feeds to Dashboard to keep up with your favorite sources.",
  },
  {
    id: "regex-visualize",
    text: "Use Regex Tester to visualize groups and quantifiers instantly.",
  },
  { id: "json-tree", text: "Switch to JSON tree view for easier data exploration." },
  {
    id: "shortcut-search",
    text: (
      <>
        Press <Kbd>{mod}</Kbd>+<Kbd>K</Kbd> to open sidebar search.
      </>
    ),
  },
  { id: "hide-tools", text: "Hide tools you rarely use from Settings → Sidebar." },
  { id: "regex-library", text: "Browse the Regex Pattern Library for ready-made examples." },
  { id: "timezone-compare", text: "Compare multiple cities at once in the Timezone board." },
];

export function useDailyTip() {
  const [tip, setTip] = useState<Tip | null>(null);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const rotate = useCallback(async () => {
    const dash = (await settingsStore.getTyped("dashboard")) || {};
    const lastId = dash.lastTipId;
    const lastIndex = lastId ? TIPS.findIndex(t => t.id === lastId) : -1;
    const nextIndex = (lastIndex + 1) % TIPS.length;
    const next = TIPS[nextIndex];
    setTip(next);
    await settingsStore.updateTyped("dashboard", {
      ...dash,
      lastTipId: next.id,
      lastTipDate: todayKey,
    });
  }, [todayKey]);

  useEffect(() => {
    (async () => {
      const dash = (await settingsStore.getTyped("dashboard")) || {};
      const lastDate = dash.lastTipDate;
      if (lastDate !== todayKey) {
        await rotate();
      } else {
        const lastId = dash.lastTipId;
        const current = TIPS.find(t => t.id === lastId) || TIPS[0];
        setTip(current);
      }
    })();
  }, [rotate, todayKey]);

  const nextTip = useCallback(() => {
    rotate();
  }, [rotate]);

  return { tip, nextTip };
}
