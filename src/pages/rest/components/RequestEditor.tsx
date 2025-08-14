import { Tabs, Text } from "@mantine/core";
import { useState } from "react";
import { RequestTab } from "../types/rest";
import BodyEditor from "./BodyEditor";
import ParamsHeadersEditor from "./ParamsHeadersEditor";

type Props = {
  tab: RequestTab;
  set: (patch: Partial<RequestTab>) => void;
};

const tabs = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" },
  { id: "body", label: "Body" },
];

export default function RequestEditor({ tab, set }: Props) {
  //   const [curlText, setCurlText] = useState("");
  const [activeId, setActiveId] = useState<string>(tabs[0].id);

  return (
    <>
      <Tabs radius="sm" value={activeId} onChange={v => v && setActiveId(v)} variant="default">
        <Tabs.List>
          {tabs.map(t => (
            <Tabs.Tab
              key={t.id}
              value={t.id}
              leftSection={<Text size="xs">{t.label}</Text>}
            ></Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      {activeId === "params" && (
        <ParamsHeadersEditor
          title="Query Params"
          rows={tab.params}
          onChange={rows => set({ params: rows })}
        />
      )}
      {activeId === "headers" && (
        <ParamsHeadersEditor
          title="Headers"
          rows={tab.headers}
          onChange={rows => set({ headers: rows })}
        />
      )}
      {activeId === "body" && <BodyEditor body={tab.body} onChange={body => set({ body })} />}

      {/* <Group>
        <TextInput
          placeholder="Paste curl here and press Enter"
          value={curlText}
          onChange={e => setCurlText(e.currentTarget.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && curlText.trim()) {
              const parsed = parseCurl(curlText.trim());
              if (parsed) {
                set({
                  method: parsed.method,
                  url: parsed.url,
                  headers: parsed.headers,
                  body: parsed.body,
                });
                setCurlText("");
              }
            }
          }}
          style={{ flex: 1 }}
        />
      </Group> */}
    </>
  );
}
