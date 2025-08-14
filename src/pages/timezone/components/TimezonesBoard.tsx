import {
  ActionIcon,
  Button,
  Card,
  Grid,
  Group,
  Select,
  Slider,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import * as ct from "countries-and-timezones";
import { useEffect, useMemo, useRef, useState } from "react";
import { BsCode, BsPencilSquare, BsTrash } from "react-icons/bs";
import { TbWorld } from "react-icons/tb";
import { TimeFormat, TimezoneRow } from "../types";
import {
  buildInstantForTzDateAtTime,
  filterTimezonesAdvanced,
  getCityCountryLabel,
  getTimeOfDayMinutesInTz,
  getTimezoneCatalog,
  getUtcOffsetString,
} from "../utils";
import classes from "./styles.module.css";

interface Props {
  rows: TimezoneRow[];
  reference: Date;
  timeFormat: TimeFormat;
  onPauseLive?: () => void; // request to pause live
  onSetReference?: (date: Date) => void; // set global reference
  onRemove?: (id: string) => void;
  onRowChange?: (row: TimezoneRow) => void;
  isLive?: boolean;
}

export default function TimezonesBoard({
  rows,
  reference,
  timeFormat,
  onPauseLive,
  onSetReference,
  onRemove,
  onRowChange,
  isLive,
}: Props) {
  return (
    <Grid>
      {rows.map(row => (
        <Grid.Col key={row.id} span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder h="100%">
            <Stack gap={8} h="100%">
              {row.isDraft ? (
                <DraftCard
                  row={row}
                  onCancel={() => {
                    // If this is a brand-new unsaved card, remove it; else revert to view mode
                    if (row.isNew) {
                      onRemove?.(row.id);
                    } else {
                      onRowChange?.({ ...row, isDraft: false });
                    }
                  }}
                  onSave={(updated: TimezoneRow) =>
                    onRowChange?.({ ...updated, isDraft: false, isNew: false })
                  }
                  reference={reference}
                />
              ) : (
                <>
                  <Group justify="space-between" align="center">
                    <Text
                      fw={600}
                      w="60%"
                      truncate
                      title={row.label || getCityCountryLabel(row.timeZone)}
                    >
                      {row.label || getCityCountryLabel(row.timeZone)}
                    </Text>
                    <Group gap={8} align="center">
                      <Tooltip label="Edit">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => onRowChange?.({ ...row, isDraft: true })}
                          aria-label={`Edit ${row.label}`}
                        >
                          <BsPencilSquare size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Remove">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => onRemove?.(row.id)}
                          aria-label={`Remove ${row.label}`}
                        >
                          <BsTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                  <PerCardControls
                    row={row}
                    reference={reference}
                    timeFormat={timeFormat}
                    onPauseLive={onPauseLive}
                    onSetReference={onSetReference}
                    isLive={isLive}
                  />
                </>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );
}

function CardSubHeader({ reference, timeZone }: { reference: Date; timeZone: string }) {
  return (
    <Group gap={16} align="center">
      <Text size="sm" c="dimmed">
        {getUtcOffsetString(reference, timeZone)}
      </Text>
      <Text size="sm" c="dimmed" style={{ textDecoration: "underline dotted" }}>
        {new Intl.DateTimeFormat("en-US", {
          timeZone,
          month: "short",
          day: "2-digit",
        }).format(reference)}
      </Text>
    </Group>
  );
}

function BigTime({
  reference,
  timeZone,
  timeFormat,
  isLive,
}: {
  reference: Date;
  timeZone: string;
  timeFormat: TimeFormat;
  isLive?: boolean;
}) {
  const hour12 = timeFormat === "h12";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  })
    .formatToParts(reference)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  return (
    <Group gap={8} align="baseline">
      <Text
        fw={600}
        style={{
          fontSize: 38,
          letterSpacing: -1,
          fontFamily: "var(--mantine-font-family-monospace)",
        }}
      >
        {parts.hour}
        <span className={isLive ? classes.timeSeparator : ""}>:</span>
        {parts.minute}
      </Text>
      {hour12 && (
        <Text size="xl" c="dimmed" fw={700}>
          {parts.dayPeriod?.toUpperCase()}
        </Text>
      )}
    </Group>
  );
}

function PerCardControls({
  row,
  reference,
  timeFormat,
  onPauseLive,
  onSetReference,
  isLive,
}: {
  row: TimezoneRow;
  reference: Date;
  timeFormat: TimeFormat;
  onPauseLive?: () => void;
  onSetReference?: (date: Date) => void;
  isLive?: boolean;
}) {
  // slider is 0..1440 minutes of day in the row's timezone
  const [value, setValue] = useState<number>(() =>
    Math.round(getTimeOfDayMinutesInTz(reference, row.timeZone))
  );
  const draggingRef = useRef<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);

  // keep slider in sync with current reference time (live or paused) when not dragging
  const effectiveRef = reference;
  const currentMinutes = useMemo(
    () => Math.round(getTimeOfDayMinutesInTz(effectiveRef, row.timeZone)),
    [effectiveRef, row.timeZone]
  );
  useEffect(() => {
    if (!dragging) {
      setValue(currentMinutes);
    }
  }, [currentMinutes, dragging]);

  return (
    <Stack gap={6}>
      <BigTime
        reference={effectiveRef}
        timeZone={row.timeZone}
        timeFormat={timeFormat}
        isLive={isLive}
      />
      <CardSubHeader reference={reference} timeZone={row.timeZone} />
      <div style={{ position: "relative", paddingTop: 8, paddingBottom: 8 }}>
        {/* array loop for 0..97 */}
        <div className={classes.sliderTicks}>
          {Array.from({ length: 97 }).map((_, i) => (
            <div key={i} className={i % 4 === 0 ? classes.sliderTick : classes.sliderTickMinor} />
          ))}
        </div>
        <Slider
          min={0}
          max={1440}
          step={1}
          value={value}
          onChange={minutes => {
            if (!draggingRef.current) {
              draggingRef.current = true;
              setDragging(true);
              onPauseLive?.();
            }
            setValue(minutes);
          }}
          // Label shows HH:MM instead of raw minutes
          label={val => {
            const h = Math.floor(val / 60);
            const m = Math.floor(val % 60);
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          }}
          // Visual style to match screenshot
          size="md"
          radius="xl"
          color="dark.6"
          thumbSize={28}
          marks={[
            { value: 0, label: "00" },
            { value: 360, label: "06" },
            { value: 720, label: "12" },
            { value: 1080, label: "18" },
            { value: 1440, label: "24" },
          ]}
          thumbChildren={<BsCode color="var(--mantine-color-dark-7)" strokeWidth={0.6} size={18} />}
          classNames={{
            track: classes.sliderTrack,
            bar: classes.sliderBar,
            mark: classes.sliderMark,
            markLabel: classes.sliderMarkLabel,
            markWrapper: classes.sliderMarkWrapper,
            thumb: classes.slideThumb,
          }}
          onChangeEnd={() => {
            const instant = buildInstantForTzDateAtTime(effectiveRef, row.timeZone, value);
            onSetReference?.(instant);
            draggingRef.current = false;
            setDragging(false);
          }}
        />
      </div>
      <DatePickerInput
        mt={24}
        value={
          dragging ? buildInstantForTzDateAtTime(effectiveRef, row.timeZone, value) : effectiveRef
        }
        onChange={d => {
          if (!d) return;
          onPauseLive?.();
          onSetReference?.(d);
        }}
      />
    </Stack>
  );
}

function DraftCard({
  row,
  onCancel,
  onSave,
}: {
  row: TimezoneRow;
  onCancel: () => void;
  onSave: (row: TimezoneRow) => void;
  reference: Date;
}) {
  const catalog = useMemo(() => getTimezoneCatalog(), []);
  const [search, setSearch] = useState("");
  const [tz] = useState<string | null>(null);
  const timeZones = useMemo(() => {
    const countryByIso2 = (() => {
      const countries = (ct as any).getAllCountries ? (ct as any).getAllCountries() : {};
      const map: Record<string, string> = {};
      Object.values(countries).forEach((c: any) => {
        map[c.id] = c.name as string;
      });
      return map;
    })();
    const src = search ? filterTimezonesAdvanced(search.trim()) : catalog;
    const mapped = src.map(r => {
      const tz = r.id;
      const parts = (r.label || "").split("•").map(p => p.trim());
      let cityName = "";
      let countryName = "";
      if (parts.length === 3 && parts[2] === tz) {
        cityName = parts[0];
        const iso2 = parts[1];
        countryName = countryByIso2[iso2] || iso2;
      } else if (parts.length >= 4 && parts[parts.length - 1] === tz) {
        cityName = parts[0];
        countryName = parts[1];
      } else {
        const segs = tz.split("/");
        cityName = (segs[1] || segs[0]).replace(/_/g, " ");
      }
      return { value: tz, label: r.label, tz, cityName, countryName } as any;
    }) as any;
    // Ensure current selection is present in options even if filtered out by search
    if (tz && !mapped.find((o: any) => o.value === tz)) {
      const fromCatalog = catalog.find(c => c.id === tz);
      if (fromCatalog) {
        const parts = (fromCatalog.label || "").split("•").map(p => p.trim());
        const cityName = parts[0] || tz.split("/")[1] || tz;
        const countryName = parts.length >= 4 ? parts[1] : "";
        mapped.unshift({ value: tz, label: fromCatalog.label, tz, cityName, countryName } as any);
      }
    }
    return mapped;
  }, [catalog, search]);
  const selectedTzLabel = useMemo(() => (tz ? getCityCountryLabel(tz) : null), [tz]);
  const currentTzLabel = useMemo(
    () => (!row.isNew && row.timeZone ? getCityCountryLabel(row.timeZone) : null),
    [row.isNew, row.timeZone]
  );
  return (
    <Stack h="100%">
      {currentTzLabel && <Text size="sm" c="dimmed">{`Current: ${currentTzLabel}`}</Text>}
      {selectedTzLabel && <Text size="sm" c="dimmed">{`Selected: ${selectedTzLabel}`}</Text>}
      <Select
        label={`${row.isNew ? "Select" : "Update"} Timezone`}
        searchable
        leftSection={<TbWorld size={16} />}
        data={timeZones}
        value={tz}
        searchValue={search}
        onSearchChange={setSearch}
        onChange={value => {
          if (!value) return;
          // Auto-save immediately with label from selected option's city/country when available
          const opt = (timeZones as any[]).find(o => o.value === value);
          const city = opt?.cityName as string | undefined;
          const country = opt?.countryName as string | undefined;
          const label = city
            ? `${city}${country ? ", " + country : ""}`
            : getCityCountryLabel(value);
          onSave({ ...row, label, timeZone: value });
        }}
        filter={({ options }) => options}
        styles={{
          label: {
            marginBottom: 6,
          },
        }}
      />
      <Group justify="end" align="flex-end" flex={1}>
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
      </Group>
    </Stack>
  );
}
