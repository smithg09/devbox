import { useCallback, useEffect, useMemo, useState } from "react";
import { formatJson, minifyJson, safeParse } from "../utils/json";

export type OutputMode = "pretty" | "minified";

export function useJsonFormatter(initial: string) {
  const [rawInput, setRawInput] = useState<string>(initial);
  const [parsed, setParsed] = useState<unknown | null>(null);
  const [error, setError] = useState<{ message: string; line?: number; column?: number } | null>(
    null
  );
  const [autoFormat, setAutoFormat] = useState<boolean>(true);
  const [outputMode, setOutputMode] = useState<OutputMode>("pretty");

  useEffect(() => {
    const handle = setTimeout(() => {
      const result = safeParse(rawInput);
      if (result.ok) {
        setParsed(result.value);
        setError(null);
        if (autoFormat) {
          const pretty = formatJson(result.value);
          if (pretty && pretty !== rawInput) {
            setRawInput(pretty);
          }
        }
      } else {
        setParsed(null);
        setError({ message: result.message, line: result.line, column: result.column });
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [rawInput, autoFormat]);

  const outputText = useMemo(() => {
    if (parsed == null) return "";
    return outputMode === "pretty" ? formatJson(parsed) : minifyJson(parsed);
  }, [parsed, outputMode]);

  const handleFormat = useCallback(() => {
    const result = safeParse(rawInput);
    if (result.ok) {
      const pretty = formatJson(result.value);
      setRawInput(pretty);
      setParsed(result.value);
      setError(null);
      setOutputMode("pretty");
      return true;
    }
    return false;
  }, [rawInput]);

  const handleMinify = useCallback(() => {
    const result = safeParse(rawInput);
    if (result.ok) {
      setParsed(result.value);
      setError(null);
      setOutputMode("minified");
      return true;
    }
    return false;
  }, [rawInput]);

  return {
    state: { rawInput, parsed, error, autoFormat, outputMode },
    setRawInput,
    setAutoFormat,
    setOutputMode,
    outputText,
    handleFormat,
    handleMinify,
  } as const;
}
