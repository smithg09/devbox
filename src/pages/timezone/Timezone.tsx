import { settingsStore } from "@/utils/store";
import { Button, Group, SegmentedControl, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import TimezonesBoard from "./components/TimezonesBoard";
import { TimeFormat, TIMEZONE_PREFERENCES_KEY, TimezonePreferencesV1, TimezoneRow } from "./types";

const DEFAULT_PREFS: TimezonePreferencesV1 = {
  version: 1,
  rows: [{ id: crypto.randomUUID(), label: "India", timeZone: "Asia/Kolkata" }],
  timeFormat: "h24",
  lastReferenceIso: undefined,
  sliderZoom: "hours",
};

export default function Timezone() {
  const [preferences, setPreferences] = useState<TimezonePreferencesV1>(DEFAULT_PREFS);
  const [reference, setReference] = useState<Date>(() =>
    preferences.lastReferenceIso ? new Date(preferences.lastReferenceIso) : new Date()
  );
  const [live, setLive] = useState<boolean>(true);

  // Keep reference ticking in live mode
  useEffect(() => {
    if (!live) return;
    const interval = 30000;
    const id = window.setInterval(() => setReference(new Date()), interval);
    return () => window.clearInterval(id);
  }, [live]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await settingsStore.get<TimezonePreferencesV1>(TIMEZONE_PREFERENCES_KEY);
      if (mounted && saved && saved.version === 1) {
        setPreferences(saved);
        setReference(saved.lastReferenceIso ? new Date(saved.lastReferenceIso) : new Date());
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const toSave: TimezonePreferencesV1 = {
      ...preferences,
      lastReferenceIso: reference.toISOString(),
    };
    settingsStore.update(TIMEZONE_PREFERENCES_KEY, toSave);
  }, [preferences, reference]);

  const handleAdd = () => {
    // Add a draft row that will render inline editor
    const draft: TimezoneRow = {
      id: crypto.randomUUID(),
      label: "",
      timeZone: "UTC",
      isDraft: true,
      isNew: true,
    };
    setPreferences(prev => ({ ...prev, rows: [...prev.rows, draft] }));
  };

  const handleRemove = (id: string) => {
    setPreferences(prev => ({ ...prev, rows: prev.rows.filter(r => r.id !== id) }));
  };

  return (
    <Stack className="overflow-padding overflow-auto" h="100%" gap="md" pt="xl">
      <Group justify="space-between" wrap="nowrap">
        <Group>
          <SegmentedControl
            data={[
              { value: "h12", label: "12h" },
              { value: "h24", label: "24h" },
            ]}
            value={preferences.timeFormat}
            onChange={e => {
              setPreferences(prev => ({
                ...prev,
                timeFormat: e as TimeFormat,
              }));
            }}
            size="xs"
          />
          <Button
            size="xs"
            variant="danger"
            disabled={live}
            onClick={() => {
              setLive(true);
              setReference(new Date());
            }}
          >
            Reset to now
          </Button>
        </Group>
        <Button size="xs" variant="light" onClick={handleAdd}>
          Add timezone
        </Button>
      </Group>

      <TimezonesBoard
        rows={preferences.rows}
        reference={reference}
        timeFormat={preferences.timeFormat}
        onRemove={handleRemove}
        onPauseLive={() => setLive(false)}
        onSetReference={setReference}
        isLive={live}
        onRowChange={(row: TimezoneRow) =>
          setPreferences(prev => ({
            ...prev,
            rows: prev.rows.map(r => (r.id === row.id ? row : r)),
          }))
        }
      />
    </Stack>
  );
}
