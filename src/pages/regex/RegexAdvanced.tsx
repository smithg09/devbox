import { useState, useEffect } from "react";
import { Box, Button, Group, Stack, SegmentedControl, Modal } from "@mantine/core";
import { BsBook } from "react-icons/bs";
import { RegexFlags, RegexMode } from "./types";
import { NormalMode } from "./NormalMode";
import { AdvancedMode } from "./AdvancedMode";
import classes from "./RegexAdvanced.module.css";
import { CheatSheet } from "./CheatSheet";

const RegexAdvanced = () => {
  const [mode, setMode] = useState<RegexMode>("normal");
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showPatternLibrary, setShowPatternLibrary] = useState(false);
  const [pattern, setPattern] = useState<string>("(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}");
  const [input, setInput] = useState<string>("example.com");
  const [flags, setFlags] = useState<RegexFlags>({
    global: true,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
    unicode: false,
    sticky: false,
  });

  const closeCheatsheet = () => {
    setShowCheatSheet(false);
  };

  const closePatternLibrary = () => {
    setShowPatternLibrary(false);
  };

  useEffect(() => {
    // Track page view or any analytics if needed
  }, []);
  return (
    <>
      <Stack gap="md" h="100%" className="overflow-padding" pb={0}>
        <Group justify="space-between" align="center">
          <SegmentedControl
            size="xs"
            value={mode}
            onChange={value => setMode(value as "normal" | "advanced")}
            data={[
              {
                label: "Normal Mode",
                value: "normal",
              },
              {
                label: "Advanced Mode",
                value: "advanced",
              },
            ]}
          />
          <div>
            <Button
              variant="default"
              leftSection={<BsBook size={16} />}
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              size="xs"
            >
              Cheat Sheet
            </Button>
            <Button
              variant="default"
              ml={6}
              leftSection={<BsBook size={16} />}
              onClick={() => setShowPatternLibrary(!showPatternLibrary)}
              size="xs"
            >
              Patterns
            </Button>
          </div>
        </Group>

        {/* Main Content */}
        <Box className={classes.content} flex={1}>
          {mode === "normal" ? (
            <NormalMode
              showPatternLibrary={showPatternLibrary}
              closePatternModal={closePatternLibrary}
              pattern={pattern}
              setPattern={setPattern}
              input={input}
              setInput={setInput}
              flags={flags}
              setFlags={setFlags}
            />
          ) : (
            <AdvancedMode
              showPatternLibrary={showPatternLibrary}
              closePatternModal={closePatternLibrary}
              pattern={pattern}
              setPattern={setPattern}
              input={input}
              setInput={setInput}
              flags={flags}
              setFlags={setFlags}
            />
          )}
        </Box>
      </Stack>
      <Modal
        opened={showCheatSheet}
        onClose={closeCheatsheet}
        title="Regular Expression Cheat Sheet"
        size="sm"
      >
        <CheatSheet />
      </Modal>
    </>
  );
};

export default RegexAdvanced;
