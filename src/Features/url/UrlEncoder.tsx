import { Alert, Group, NativeSelect, SegmentedControl, Stack, Textarea } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BsExclamationTriangle } from "react-icons/bs";
import { decodeAuto, encodeFormUrlencoded, encodeUri, encodeUriComponentStrict } from "./utils/url";

type Mode = "encode" | "decode";

export default function UrlEncoder() {
  const [mode, setMode] = useState<Mode>("encode");
  const [preset, setPreset] = useState<string>("encodeURIComponent");
  const [plusAsSpace, setPlusAsSpace] = useState<boolean>(true);
  const [input, setInput] = useState<string>(
    "https://user:pass@example.com:8080/path/seg?foo=bar&foo=2#hash"
  );
  const [error, setError] = useState<string | undefined>();

  const encode = useCallback((preset: string, input: string) => {
    switch (preset) {
      case "encodeURIComponent":
        return encodeUriComponentStrict(input);
      case "encodeURI":
        return encodeUri(input);
      case "formUrlEncoded":
        return encodeFormUrlencoded(input);
      default:
        return encodeUriComponentStrict(input);
    }
  }, []);

  const output = useMemo(() => {
    try {
      setError(undefined);
      if (mode === "encode") {
        return encode(preset, input);
      } else {
        return decodeAuto(input, { plusAsSpace });
      }
    } catch (e) {
      setError((e as Error).message || "Failed to process input");
      return "";
    }
  }, [input, mode, plusAsSpace, preset, input]);

  useEffect(() => {
    if (mode === "decode" && output) {
      setInput(encode(preset, output));
    } else if (mode === "encode") {
      setInput(decodeAuto(input, { plusAsSpace }));
    }
  }, [mode, preset]);

  return (
    <Stack p="sm" gap="md" style={{ height: "100%" }}>
      <Group justify="space-between">
        <SegmentedControl
          size="xs"
          value={mode}
          onChange={v => setMode(v as Mode)}
          data={[
            { label: "Encode", value: "encode" },
            { label: "Decode", value: "decode" },
          ]}
        />
        {mode === "encode" ? (
          <NativeSelect
            size="xs"
            value={preset}
            onChange={e => setPreset(e.currentTarget.value || "encodeURIComponent")}
            data={[
              { value: "encodeURIComponent", label: "encodeURIComponent" },
              { value: "encodeURI", label: "encodeURI" },
              { value: "formUrlEncoded", label: "application/x-www-form-urlencoded" },
            ]}
          />
        ) : (
          <SegmentedControl
            size="xs"
            value={plusAsSpace ? "plus" : "percent"}
            onChange={v => setPlusAsSpace(v === "plus")}
            data={[
              { label: "+ = space", value: "plus" },
              { label: "% only", value: "percent" },
            ]}
          />
        )}
      </Group>

      {error && (
        <Alert color="red" icon={<BsExclamationTriangle />}>
          {error}
        </Alert>
      )}

      <Group grow align="flex-start">
        <Textarea
          autosize
          minRows={10}
          label="Input"
          value={input}
          onChange={e => setInput(e.currentTarget.value)}
        />
        <Textarea autosize minRows={10} label="Output" value={output} readOnly />
      </Group>
    </Stack>
  );
}
