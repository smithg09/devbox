import { CopyButton } from "@/components/CopyButton";
import { Box, Group, NativeSelect, Select, Stack, Switch, Text, TextInput } from "@mantine/core";
import { InputData, jsonInputForTargetLanguage, quicktype } from "quicktype-core";
import { useCallback, useEffect, useState } from "react";

import { MonacoEditor } from "@/components/Monaco/Editor";
import { DEFAULT_INPUT, DEFAULT_LANG, DEFAULT_NAME, LANGUAGE_PRESET } from "./constant";
import { LANGUAGE_OPTION_DEFS, initialLanguageOptionValues } from "./languageOptions";

export default function Quicktype() {
  const [output, setOutput] = useState("");
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [language, setLanguage] = useState<string | undefined>(DEFAULT_LANG);
  const [typeName, setTypeName] = useState(DEFAULT_NAME);
  const [langOptions, setLangOptions] = useState<Record<string, string>>(
    initialLanguageOptionValues[language || ""] || {}
  );

  // Reset language option values when language changes
  useEffect(() => {
    if (!language) return;
    setLangOptions(prev => ({ ...initialLanguageOptionValues[language], ...prev }));
  }, [language]);

  const generateQuickType = useCallback(
    async (e: string) => {
      try {
        const jsonInput = jsonInputForTargetLanguage(language || ("rust" as any));
        await jsonInput.addSource({
          name: typeName,
          samples: [e],
        });
        const inputData = new InputData();
        inputData.addInput(jsonInput);
        const o = await quicktype({
          inputData,
          lang: (language as any) || (DEFAULT_LANG as any),
          rendererOptions: langOptions,
        });
        setOutput(o.lines.join("\n"));
      } catch (err: any) {
        setOutput("// invalid input json");
      }
    },
    [language, typeName, langOptions]
  );

  useEffect(() => {
    const t = setTimeout(() => generateQuickType(input), 400);
    return () => clearTimeout(t);
  }, [input, language, typeName, generateQuickType]);

  return (
    <Stack className="overflow-padding" h="100%" gap={8}>
      <Group gap="xs" dir="row" justify="space-between" align="flex-end">
        <Group align="flex-start">
          <TextInput
            size="xs"
            label="Name"
            placeholder="Enter type name here..."
            value={typeName}
            onChange={e => setTypeName(e.currentTarget.value)}
          />
          <NativeSelect
            size="xs"
            label="Language"
            value={language}
            onChange={e => setLanguage(e.currentTarget.value)}
            data={LANGUAGE_PRESET.map(l => ({
              value: l.language,
              label: l.label,
            }))}
          />
        </Group>

        {/* Language specific options */}
        {language && LANGUAGE_OPTION_DEFS[language] && (
          <Group gap={12} wrap="nowrap" align="flex-end" justify="flex-start" flex={1}>
            {LANGUAGE_OPTION_DEFS[language].map(opt => {
              const value = langOptions[opt.key];
              const setValue = (v: string | boolean) =>
                setLangOptions(lo => ({ ...lo, [opt.key]: String(v) }));
              if (opt.type === "boolean") {
                return (
                  <Switch
                    mb={8}
                    key={opt.key}
                    size="xs"
                    label={opt.label}
                    checked={value === "true"}
                    onChange={e => setValue(e.currentTarget.checked)}
                  />
                );
              }
              if (opt.type === "text") {
                return (
                  <TextInput
                    key={opt.key}
                    size="xs"
                    label={opt.label}
                    value={value || opt.default || ""}
                    onChange={e => setValue(e.currentTarget.value)}
                  />
                );
              }
              if (opt.type === "select") {
                return (
                  <Select
                    key={opt.key}
                    size="xs"
                    label={opt.label}
                    value={value || opt.default || undefined}
                    onChange={v => v && setValue(v)}
                    data={(opt.options || []).map(o => ({ value: o.value, label: o.label }))}
                  />
                );
              }
              return null;
            })}
          </Group>
        )}
      </Group>
      <Group wrap="nowrap" gap={8} mt={4} style={{ height: "100%", width: "100%" }}>
        <Box h="100%" w="30%">
          <Text size="sm" c="dimmed" fw="600" mb={8}>
            JSON Input
          </Text>
          <Box style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }} h="100%">
            <MonacoEditor
              width="100%"
              value={input}
              language="json"
              setValue={e => setInput(e || "")}
              extraOptions={{ automaticLayout: true }}
            />
          </Box>
        </Box>
        <Box h="100%" w="70%" flex={1}>
          <Group justify="flex-end">
            <CopyButton
              fullWidth={false}
              size="xs"
              variant="light"
              value={output}
              label="Copy Output"
              style={{
                position: "relative",
                top: -8,
              }}
            />
          </Group>

          <Box style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }} h="100%">
            <MonacoEditor
              width="100%"
              value={output}
              language={LANGUAGE_PRESET.find(l => l.language === language)?.sourceLang || "text"}
              extraOptions={{ readOnly: true, automaticLayout: true }}
            />
          </Box>
        </Box>
      </Group>
    </Stack>
  );
}
