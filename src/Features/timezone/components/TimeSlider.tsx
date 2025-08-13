import { Group, SegmentedControl, Slider, Text } from "@mantine/core";
import { useMemo } from "react";
import { SliderZoom } from "../types";

interface Props {
  reference: Date;
  onChange: (date: Date) => void;
  zoom: SliderZoom;
  onZoomChange: (zoom: SliderZoom) => void;
}

export default function TimeSlider({ reference, onChange, zoom, onZoomChange }: Props) {
  const range = useMemo(() => {
    if (zoom === "hours") {
      return { min: -12, max: 12, step: 0.25, unitMs: 3600000 } as const; // 15 min
    }
    return { min: -14, max: 14, step: 1, unitMs: 86400000 } as const; // 1 day
  }, [zoom]);

  const value = 0; // centered at reference

  return (
    <Group align="center" justify="space-between">
      <SegmentedControl
        value={zoom}
        onChange={v => onZoomChange(v as SliderZoom)}
        data={[
          { label: "Hours", value: "hours" },
          { label: "Days", value: "days" },
        ]}
      />
      <Slider
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={delta => {
          const ms = delta * range.unitMs;
          onChange(new Date(reference.getTime() + ms));
        }}
        style={{ flex: 1 }}
        label={val => `${val} ${zoom === "hours" ? "h" : "d"}`}
      />
      <Text size="sm" c="dimmed">
        {reference.toISOString()}
      </Text>
    </Group>
  );
}
