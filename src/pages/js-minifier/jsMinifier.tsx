import { Box, Checkbox, Group, NativeSelect, SegmentedControl, Stack } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";

import * as prettier from "prettier";

import { CopyButton } from "@/components/CopyButton";
import { MonacoEditor } from "@/components/Monaco/Editor";
import acorn from "prettier/plugins/acorn";
import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";
import tsPlugin from "prettier/plugins/typescript";
import { minify as terserMinify } from "terser";

// NOTE: We purposefully avoid a static import of 'typescript' because the TS
// compiler is large. It is only needed when minifying TypeScript/TSX, so we
// dynamically import it on demand to keep the initial bundle smaller.

export default function JSMinifier() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [execMode, setExecMode] = useState("minify");
  const [jsx, setJsx] = useState(false);
  const [language, setLanguage] = useState("typescript");
  const [compress, setCompress] = useState(true);
  const [mangle, setMangle] = useState(false);

  const format = useCallback(async () => {
    try {
      const parser = language === "typescript" ? "babel-ts" : "babel"; // always use babel-ts for TS (with or without JSX)
      const source = input;
      const result = await prettier.format(source, {
        parser,
        plugins: [babel, acorn, estree, tsPlugin],
        printWidth: 80,
        semi: true,
        singleQuote: false,
        trailingComma: "es5",
      });
      setOutput(result);
    } catch (e) {
      console.error(e);
      setOutput("Error:" + (e as any).message);
    }
  }, [execMode, input, output, jsx, language, compress, mangle]);

  const minify = useCallback(async () => {
    try {
      let code = input;

      if (language === "typescript") {
        try {
          const ts: typeof import("typescript") = await import(
            /* webpackChunkName: "ts-compiler" */ "typescript"
          );
          // Transpile TS/TSX to plain JS before feeding to terser.
          const transpiled = ts.transpileModule(code, {
            compilerOptions: {
              target: ts.ScriptTarget.ES2020,
              module: ts.ModuleKind.ESNext,
              jsx: jsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
              sourceMap: false,
              removeComments: true,
            },
          });
          code = transpiled.outputText;
        } catch (err) {
          console.error("TypeScript transpile failed", err);
          setOutput("Error: Failed to transpile TypeScript - " + (err as any).message);
          return;
        }
      } else if (jsx) {
        // If user selected JSX with language javascript, we still need to ensure JSX is compilable.
        // terser does NOT parse JSX, so we use a lightweight transform via dynamic TS compiler in allowJs mode.
        try {
          const ts: typeof import("typescript") = await import("typescript");
          const transpiled = ts.transpileModule(code, {
            compilerOptions: {
              allowJs: true,
              target: ts.ScriptTarget.ES2020,
              module: ts.ModuleKind.ESNext,
              jsx: ts.JsxEmit.ReactJSX,
              sourceMap: false,
            },
            fileName: "file.jsx",
          });
          code = transpiled.outputText;
        } catch (err) {
          console.warn("JSX transform failed, attempting minify without transform", err);
        }
      }

      if (!code.trim()) {
        setOutput("");
        return;
      }

      const op = await terserMinify(code, {
        compress,
        sourceMap: false,
        mangle,
      });
      setOutput(op.code || "");
    } catch (e) {
      console.error(e);
      setOutput("Error:" + (e as any).message);
    }
  }, [execMode, input, jsx, language, compress, mangle]);

  useEffect(() => {
    // Automatically format/minify on input change
    if (execMode === "minify") {
      minify();
    } else {
      format();
    }
  }, [execMode, input, jsx, language, compress, mangle, minify, format]);

  return (
    <Stack className="overflow-padding" h="100%">
      <Group gap="xs" dir="row" justify="space-between">
        <Group>
          <SegmentedControl
            size="xs"
            value={execMode}
            onChange={e => setExecMode(e ?? "Minify")}
            data={[
              { label: "Minify", value: "minify" },
              { label: "Beautify", value: "beautify" },
            ]}
          />
          <NativeSelect
            size="xs"
            data={[
              { label: "Typescript", value: "typescript" },
              { label: "Javascript", value: "javascript" },
            ]}
            value={language}
            onChange={e => setLanguage(e.target.value ?? "typescript")}
          />
          <Checkbox
            size="xs"
            label="JSX/TSX"
            checked={jsx}
            onChange={e => setJsx(e.target.checked)}
          />
          {execMode === "minify" && (
            <>
              <Checkbox
                size="xs"
                label="Mangle"
                checked={mangle}
                onChange={e => setMangle(e.target.checked)}
              />
              <Checkbox
                size="xs"
                label="Compress"
                checked={compress}
                onChange={e => setCompress(e.target.checked)}
              />
            </>
          )}
        </Group>
        <CopyButton
          fullWidth={false}
          size="xs"
          variant="light"
          value={output}
          label="Copy Output"
        />
      </Group>
      <Group wrap="nowrap" grow style={{ height: "100%", width: "100%" }}>
        <Box
          h="100%"
          w="100%"
          flex={1}
          style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
        >
          <MonacoEditor
            value={input}
            language={language}
            setValue={e => setInput(e || "")}
            extraOptions={{ automaticLayout: true }}
          />
        </Box>
        <Box
          h="100%"
          flex={1}
          style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
        >
          <MonacoEditor
            value={output}
            language={language}
            extraOptions={{ readOnly: true, automaticLayout: true }}
          />
        </Box>
      </Group>
    </Stack>
  );
}
