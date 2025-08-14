import React, { useState, useEffect } from "react";
import {
  Stack,
  TextInput,
  Textarea,
  Group,
  Checkbox,
  Text,
  Box,
  Button,
  Badge,
  CopyButton,
  Divider,
  Modal,
} from "@mantine/core";
import { BsCopy, BsCheck } from "react-icons/bs";
import { RegexEngine } from "./RegexEngine";
import { RegexTestResult, RegexFlags } from "./types";
import classes from "./RegexAdvanced.module.css";
import { PatternLibrary } from "./PatternLibrary";

interface NormalModeProps {
  showPatternLibrary: boolean;
  closePatternModal: () => void;
  pattern: string;
  setPattern: (pattern: string) => void;
  input: string;
  setInput: (input: string) => void;
  flags: RegexFlags;
  setFlags: React.Dispatch<React.SetStateAction<RegexFlags>>;
}

export const NormalMode = ({
  showPatternLibrary,
  closePatternModal,
  pattern,
  setPattern,
  input,
  setInput,
  flags,
  setFlags,
}: NormalModeProps) => {
  const [result, setResult] = useState<RegexTestResult>({
    matches: [],
    groups: [],
    performance: { executionTime: 0, matchCount: 0, iterations: 0 },
  });

  useEffect(() => {
    const testRegex = async () => {
      const testResult = await RegexEngine.testRegex(pattern, input, flags);
      setResult(testResult);
    };

    const timeoutId = setTimeout(testRegex, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [pattern, input, flags]);

  const handleFlagChange =
    (flag: keyof RegexFlags) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFlags(prev => ({ ...prev, [flag]: event.target.checked }));
    };

  const renderHighlightedText = () => {
    if (!input) return null;
    if (result.error) {
      return (
        <Text c="red" className={classes.testInput}>
          {input}
        </Text>
      );
    }

    if (result.matches.length === 0) {
      return <Text className={classes.testInput}>{input}</Text>;
    }

    const parts = [];
    let lastIndex = 0;

    result.matches.forEach((match, index) => {
      // Add text before match
      if (lastIndex < match.start) {
        parts.push(input.slice(lastIndex, match.start));
      }

      // Add highlighted match
      parts.push(
        <span key={index} className={classes.matchHighlight}>
          {match.match}
        </span>
      );

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < input.length) {
      parts.push(input.slice(lastIndex));
    }

    return <div style={{ whiteSpace: "pre-wrap" }}>{parts}</div>;
  };

  const handlePatternSelect = (selectedPattern: string, selectedFlags: Partial<RegexFlags>) => {
    setPattern(selectedPattern);
    setFlags(prev => ({ ...prev, ...selectedFlags }));
    closePatternModal();
  };

  return (
    <>
      <Stack gap="md" h="100%">
        {/* Pattern Input */}
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Regular Expression Pattern
            </Text>
            {pattern && (
              <CopyButton value={pattern}>
                {({ copied, copy }) => (
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={copy}
                    leftSection={copied ? <BsCheck size={16} /> : <BsCopy size={16} />}
                  >
                    Copy pattern
                  </Button>
                )}
              </CopyButton>
            )}
          </Group>
          <TextInput
            placeholder="Enter your regex pattern"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            error={result.error}
            className={classes.patternInput}
            size="md"
          />

          {/* Flags */}
          <Group gap="lg">
            <Checkbox
              label="Global (g)"
              checked={flags.global}
              onChange={handleFlagChange("global")}
              size="sm"
            />
            <Checkbox
              label="Case Insensitive (i)"
              checked={flags.ignoreCase}
              onChange={handleFlagChange("ignoreCase")}
              size="sm"
            />
            <Checkbox
              label="Multiline (m)"
              checked={flags.multiline}
              onChange={handleFlagChange("multiline")}
              size="sm"
            />
            <Checkbox
              label="Dot All (s)"
              checked={flags.dotAll}
              onChange={handleFlagChange("dotAll")}
              size="sm"
            />
          </Group>
        </Stack>

        {/* Test Input */}
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Test String
            </Text>
            <Text size="xs" c="dimmed">
              {input.length} characters
            </Text>
          </Group>
          <Textarea
            placeholder="Enter text to test your regex against"
            value={input}
            onChange={e => setInput(e.target.value)}
            minRows={4}
            autosize
            maxRows={8}
            className={classes.testInput}
          />
        </Stack>
        <Divider />
        {/* Results */}
        <Stack gap="sm">
          <Group justify="space-between">
            <Group align="center">
              <Text size="sm" fw={500}>
                Results
              </Text>
              <Badge variant="light" color={result.error ? "red" : "blue"}>
                {result.error ? "Error" : `${result.matches.length} matches`}
              </Badge>
            </Group>
          </Group>

          {/* Highlighted Text */}
          <Box
            style={{
              backgroundColor: "var(--mantine-color-dark-6)",
              border: "1px solid var(--mantine-color-dark-4)",
              padding: "12px",
              borderRadius: "8px",
              minHeight: "100px",
              overflow: "auto",
            }}
          >
            {renderHighlightedText()}
          </Box>

          {/* Performance Info */}
          {!result.error && (
            <Group justify="space-between" className={classes.performanceMetrics}>
              <Text size="xs" c="dimmed">
                Execution: {result.performance.executionTime.toFixed(2)}ms
              </Text>
              <Text size="xs" c="dimmed">
                Iterations: {result.performance.iterations}
              </Text>
            </Group>
          )}
        </Stack>
      </Stack>
      <Modal
        opened={showPatternLibrary}
        onClose={closePatternModal}
        title="Pattern Library"
        size="sm"
      >
        <PatternLibrary onPatternSelect={handlePatternSelect} />
      </Modal>
    </>
  );
};
