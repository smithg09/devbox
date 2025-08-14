import { CopyButton } from "@/components/CopyButton";
import { Alert, Box, Group, Stack, Tabs, Text } from "@mantine/core";
import { useRef, useState } from "react";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { JsonInput } from "./components/Editors/JsonInput";
import styles from "./components/styles.module.css";
import { Toolbar } from "./components/Toolbar";
import { JsonText } from "./components/Viewers/JsonText";
import { JsonTree } from "./components/Viewers/JsonTree";
import { useJsonFormatter } from "./hooks/useJsonFormatter";

const SAMPLE_JSON = `{
  "name": "DevBox",
  "version": "1.0.0",
  "features": [
    { "id": 1, "name": "JSON Formatter", "enabled": true },
    { "id": 2, "name": "Regex Tester", "enabled": true }
  ],
  "meta": { "createdAt": "2024-01-01T00:00:00Z" }
}`;

export default function JsonFormatter() {
  const {
    state: { rawInput, parsed, error, autoFormat },
    setRawInput,
    setAutoFormat,
    outputText,
    handleFormat,
    handleMinify,
  } = useJsonFormatter(SAMPLE_JSON);
  const [collapsedDepth, setCollapsedDepth] = useState<number | boolean>(2);
  const [activeTab, setActiveTab] = useState<string>("tree");
  const leftPanelRef = useRef<ImperativePanelHandle>(null);

  const onExpandAll = () => setCollapsedDepth(false);
  const onCollapseAll = () => setCollapsedDepth(1);

  return (
    <Stack className={`overflow-padding ${styles.containerStack}`} gap="sm">
      <Toolbar
        autoFormat={autoFormat}
        setAutoFormat={setAutoFormat}
        onFormat={() => {
          if (handleFormat()) setActiveTab("tree");
        }}
        onMinify={() => {
          if (handleMinify()) setActiveTab("text");
        }}
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        collapsedDepth={collapsedDepth}
        setCollapsedDepth={v => setCollapsedDepth(v)}
      />

      {error && (
        <Alert color="red" title="Invalid JSON" variant="light">
          <Text fz="xs">
            {error.line && error.column
              ? `Error at line ${error.line}, column ${error.column}: ${error.message}`
              : error.message}
          </Text>
        </Alert>
      )}

      <Group className={styles.groupMain} grow gap={12} align="stretch">
        <PanelGroup direction="horizontal">
          <Panel ref={leftPanelRef}>
            <Box className={styles.panelBox}>
              <Stack gap={6} h="100%" style={{ flex: 1, minHeight: 0 }}>
                <JsonInput value={rawInput} onChange={setRawInput} />
              </Stack>
            </Box>
          </Panel>
          <PanelResizeHandle
            className={styles.resizeHandle}
            onDoubleClick={() => {
              leftPanelRef.current?.resize(50);
            }}
          >
            <Box className={styles.resizeHandler} />
          </PanelResizeHandle>
          <Panel>
            <Box className={styles.panelBox}>
              <Tabs
                value={activeTab}
                onChange={value => setActiveTab(value || "tree")}
                className={styles.tabsRoot}
                bg="#191919"
              >
                <Tabs.List>
                  <Tabs.Tab value="tree">Tree</Tabs.Tab>
                  <Tabs.Tab value="text">Text</Tabs.Tab>
                  <CopyButton
                    value={outputText}
                    variant="subtle"
                    size="xs"
                    fullWidth={false}
                    label="Copy"
                    m={6}
                    ml="auto"
                  />
                </Tabs.List>
                <Tabs.Panel value="tree" className={styles.panelTree}>
                  <JsonTree
                    value={parsed}
                    collapsedDepth={collapsedDepth}
                    onChange={next => {
                      try {
                        setRawInput(JSON.stringify(next, null, 2));
                      } catch (e) {
                        // ignore stringify failure
                      }
                    }}
                  />
                </Tabs.Panel>
                <Tabs.Panel value="text" className={styles.panelText}>
                  <JsonText value={outputText} />
                </Tabs.Panel>
              </Tabs>
            </Box>
          </Panel>
        </PanelGroup>
      </Group>
    </Stack>
  );
}
