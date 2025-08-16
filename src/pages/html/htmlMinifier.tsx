import { Badge, Box, Checkbox, Group, SegmentedControl, Stack } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CopyButton } from "@/components/CopyButton";
import { MonacoEditor } from "@/components/Monaco/Editor";
import { minify as cssMinify } from "csso";
import * as prettier from "prettier";
import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";
import html from "prettier/plugins/html";
import postcss from "prettier/plugins/postcss";
import { minify as terserMinify } from "terser";

export default function HtmlMinifier() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [removeComments, setRemoveComments] = useState(true);
  const [minifyScripts, setMinifyScripts] = useState(true);
  const [minifyStyles, setMinifyStyles] = useState(true);
  const [execMode, setExecMode] = useState("minify");
  const [formatEmbedded, setFormatEmbedded] = useState(true);

  const gzipSize = useMemo(() => {
    if (!output) return 0;
    try {
      return Math.round(new TextEncoder().encode(output).length * 0.3);
    } catch {
      return 0;
    }
  }, [output]);

  const format = useCallback(async () => {
    try {
      const result = await prettier.format(input, {
        parser: "html",
        plugins: [html, babel, estree, postcss],
        xmlWhitespaceSensitivity: "ignore",
        htmlWhitespaceSensitivity: "ignore",
        xmlSelfClosingSpace: true,
        embeddedLanguageFormatting: formatEmbedded ? "auto" : "off",
        endOfLine: "auto",
      });
      setOutput(result);
    } catch (e) {
      console.error(e);
      setOutput("[Error] HTML Formatting:" + (e as any).message);
    }
  }, [execMode, input, formatEmbedded]);

  // Very lightweight in-browser HTML minifier (conservative):
  // - Optionally removes comments <!-- --> (excluding conditional IE comments)
  // - Optionally collapses consecutive whitespace between tags
  // - Preserves content inside <pre>, <code>, <textarea>, <script>, <style>
  const simpleHtmlMinify = async (htmlStr: string) => {
    if (!htmlStr) return "";
    let working = htmlStr;

    // Minify <script> blocks
    if (minifyScripts) {
      working = await replaceAsync(
        working,
        /<script(\b[^>]*)>([\s\S]*?)<\/script>/gi,
        async (full, attrs = "", code = "") => {
          const attr = attrs || "";
          // Skip JSON / non-JS script types
          if (/type\s*=\s*"(application|text)\/(json|ld\+json)"/i.test(attr)) return full;
          const trimmed = code.trim();
          if (!trimmed) return full;
          try {
            const result = await terserMinify(trimmed, { mangle: true, compress: true });
            if (result.code) return `<script${attr}>${result.code}</script>`;
          } catch (_e) {
            // fail silently
          }
          return full;
        }
      );
    }

    // Minify <style> blocks
    if (minifyStyles) {
      working = working.replace(
        /<style(\b[^>]*)>([\s\S]*?)<\/style>/gi,
        (_full, attrs = "", css = "") => {
          const trimmed = css.trim();
          if (!trimmed) return _full;
          try {
            const result = cssMinify(trimmed);
            return `<style${attrs}>${result.css}</style>`;
          } catch (_e) {
            return _full;
          }
        }
      );
    }

    // Preserve blocks where whitespace should remain (pre/code/textarea)
    const placeholders: string[] = [];
    const token = "__PRESERVE_BLOCK__";
    working = working.replace(
      /<(pre|code|textarea)(\b[^>]*)>([\s\S]*?)<\/\1>/gi,
      (_m, tag, attrs, body) => {
        const i = placeholders.length;
        placeholders.push(body);
        return `<${tag}${attrs}>${token}${i}__</${tag}>`;
      }
    );

    if (removeComments) {
      working = working.replace(/<!--(?!\[if|<!|>)([\s\S]*?)-->/g, "");
    }
    // collapse whitespace
    working = working
      .replace(/>[ \t\f\r\n]+</g, "><")
      .replace(/\s{2,}/g, " ")
      .replace(/\n+/g, "");

    working = working.trim();

    working = working.replace(
      new RegExp(token + "(\\d+)__", "g"),
      (_m, i) => placeholders[Number(i)]
    );
    return working;
  };

  // helper for async replace on scripts
  function replaceAsync(str: string, regex: RegExp, asyncFn: (...args: any[]) => Promise<string>) {
    const promises: Promise<string>[] = [];
    str.replace(regex, function (...args) {
      const promise = asyncFn.apply(null, args as any);
      promises.push(promise);
      return "";
    });
    return Promise.all(promises).then(res => {
      let i = 0;
      return str.replace(regex, () => res[i++]);
    });
  }

  const minify = useCallback(async () => {
    try {
      const minified = await simpleHtmlMinify(input);
      setOutput(minified);
    } catch (e) {
      console.error(e);
      setOutput("[Error] HTML Minification:" + (e as any).message);
    }
  }, [input, removeComments, minifyScripts, minifyStyles]);

  useEffect(() => {
    // Auto minify/format on input change
    if (execMode === "minify") {
      minify();
    } else {
      format();
    }
  }, [execMode, input, format, minify]);

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
          {execMode === "minify" && (
            <>
              <Checkbox
                size="xs"
                label="Remove Comments"
                checked={removeComments}
                onChange={e => setRemoveComments(e.currentTarget.checked)}
              />
              <Checkbox
                size="xs"
                label="Minify JS/CSS"
                checked={minifyScripts}
                onChange={e => {
                  setMinifyScripts(e.currentTarget.checked);
                  setMinifyStyles(e.currentTarget.checked);
                }}
              />
            </>
          )}
          {execMode === "beautify" && (
            <Checkbox
              size="xs"
              label="Format embedded JS/CSS"
              checked={formatEmbedded}
              onChange={e => setFormatEmbedded(e.currentTarget.checked)}
            />
          )}
          <Badge variant="light">Gzip≈ {gzipSize} B</Badge>
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
            language="html"
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
            language="html"
            extraOptions={{ readOnly: true, automaticLayout: true }}
          />
        </Box>
      </Group>
    </Stack>
  );
}
