import { Stack } from "@mantine/core";
import { useMemo, useRef, useState } from "react";
import RestEditor from "./components/RestEditor";
import TabStrip from "./components/TabStrip";
import { RequestTab } from "./types/rest";
import { sendRequest } from "./utils/request";

function createNewTab(idx: number): RequestTab {
  return {
    id: crypto.randomUUID(),
    title: `Tab ${idx}`,
    method: "GET",
    url: "https://jsonplaceholder.cypress.io/posts/1",
    params: [{ id: crypto.randomUUID(), key: "", value: "", enabled: true }],
    headers: [{ id: crypto.randomUUID(), key: "", value: "", enabled: true }],
    body: { mode: "none" },
    meta: { dirty: false },
  };
}

export type LayoutType = "vertical" | "two-column";

export default function Rest() {
  const [tabs, setTabs] = useState<RequestTab[]>([createNewTab(1)]);
  const [activeId, setActiveId] = useState<string>(tabs[0].id);
  const [layout, setLayout] = useState<LayoutType>("vertical");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeTab = useMemo(() => tabs.find(t => t.id === activeId)!, [tabs, activeId]);

  const updateTab = (id: string, patch: Partial<RequestTab>) =>
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));

  const onAdd = () => {
    const newTab = createNewTab(tabs.length + 1);
    setTabs(prev => [...prev, newTab]);
    setActiveId(newTab.id);
  };
  const onClose = (id: string) => {
    const idx = tabs.findIndex(t => t.id === id);
    const filtered = tabs.filter(t => t.id !== id);
    setTabs(filtered.length ? filtered : [createNewTab(1)]);
    if (activeId === id) {
      const next = filtered[Math.max(0, idx - 1)]?.id || filtered[0]?.id;
      if (next) setActiveId(next);
    }
  };
  const onDuplicate = (id: string) => {
    const t = tabs.find(x => x.id === id);
    if (!t) return;
    const copy: RequestTab = { ...t, id: crypto.randomUUID(), title: `${t.title} copy` };
    setTabs(prev => [...prev, copy]);
    setActiveId(copy.id);
  };

  const handleSend = async () => {
    if (!activeTab) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setSendingId(activeTab.id);
    try {
      const res = await sendRequest({
        method: activeTab.method,
        url: activeTab.url,
        params: activeTab.params,
        headers: activeTab.headers,
        body: activeTab.body,
        signal: ac.signal,
      });
      updateTab(activeTab.id, { lastResponse: res, lastError: undefined });
    } catch (e) {
      updateTab(activeTab.id, { lastError: (e as Error).message, lastResponse: undefined });
    } finally {
      setSendingId(null);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setSendingId(null);
  };

  return (
    <Stack className="overflow-padding overflow-auto" style={{ height: "100%" }}>
      <TabStrip
        tabs={tabs}
        activeId={activeId}
        onChange={setActiveId}
        onAdd={onAdd}
        onClose={onClose}
        onDuplicate={onDuplicate}
        layout={layout}
        onToggleLayout={() => setLayout(l => (l === "vertical" ? "two-column" : "vertical"))}
      />
      <RestEditor
        layout={layout}
        tab={activeTab}
        onChange={t => updateTab(activeTab.id, t)}
        onSend={handleSend}
        onCancel={handleCancel}
        sending={sendingId === activeTab.id}
      />
    </Stack>
  );
}
