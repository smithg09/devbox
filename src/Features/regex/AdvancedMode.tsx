import React, { useState, useEffect } from "react";
import {
  Stack,
  TextInput,
  Textarea,
  Group,
  Checkbox,
  Paper,
  Text,
  Box,
  Button,
  Badge,
  CopyButton,
  Tabs,
  ScrollArea,
  Card,
  Modal,
} from "@mantine/core";
import { BsCopy, BsCheck, BsEye } from "react-icons/bs";
import { RegexEngine } from "./RegexEngine";
import { RegexTestResult, RegexFlags } from "./types";
import { PatternLibrary } from "./PatternLibrary";
import { RegexDiagram } from "./RegexDiagram";
import classes from "./RegexAdvanced.module.css";

interface AdvancedModeProps {
  showPatternLibrary: boolean;
  closePatternModal: () => void;
  pattern: string;
  setPattern: (pattern: string) => void;
  input: string;
  setInput: (input: string) => void;
  flags: RegexFlags;
  setFlags: React.Dispatch<React.SetStateAction<RegexFlags>>;
}

export const AdvancedMode = ({
  showPatternLibrary,
  closePatternModal,
  pattern,
  setPattern,
  input,
  setInput,
  flags,
  setFlags,
}: AdvancedModeProps) => {
  const [result, setResult] = useState<RegexTestResult>({
    matches: [],
    groups: [],
    performance: { executionTime: 0, matchCount: 0, iterations: 0 },
  });
  const [activeTab, setActiveTab] = useState<string>("matches");
  const [showDiagram, setShowDiagram] = useState(false);

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

  const handlePatternSelect = (selectedPattern: string, selectedFlags: Partial<RegexFlags>) => {
    setPattern(selectedPattern);
    setFlags(prev => ({ ...prev, ...selectedFlags }));
    closePatternModal();
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

  return (
    <>
      <Stack gap="md" h="100%">
        {/* Pattern Input with Advanced Controls */}
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Regular Expression Pattern
            </Text>
            <Group gap="xs">
              <Button
                variant="subtle"
                size="xs"
                leftSection={<BsEye size={14} />}
                onClick={() => setShowDiagram(!showDiagram)}
              >
                Diagram
              </Button>
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
          </Group>

          <TextInput
            placeholder="Enter your regex pattern"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            error={result.error}
            className={classes.patternInput}
            size="md"
          />

          {/* Explanation */}
          {pattern && !result.error && (
            <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
              {RegexEngine.explainPattern(pattern)}
            </Text>
          )}

          {/* All Flags */}
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
            <Checkbox
              label="Unicode (u)"
              checked={flags.unicode}
              onChange={handleFlagChange("unicode")}
              size="sm"
            />
            <Checkbox
              label="Sticky (y)"
              checked={flags.sticky}
              onChange={handleFlagChange("sticky")}
              size="sm"
            />
          </Group>
        </Stack>

        {/* Visual Tools */}
        {showDiagram && (
          <Paper p="md" withBorder>
            <RegexDiagram pattern={pattern} />
          </Paper>
        )}

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

        {/* Advanced Results */}
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

          <Tabs value={activeTab} onChange={value => setActiveTab(value || "matches")}>
            <Tabs.List>
              <Tabs.Tab value="matches">Matches</Tabs.Tab>
              <Tabs.Tab value="groups">Groups</Tabs.Tab>
              <Tabs.Tab value="performance">Performance</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="matches" pt="md">
              <Stack gap="sm">
                {/* Highlighted Text */}
                <Box
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "var(--mantine-color-dark-6)",
                    border: "1px solid var(--mantine-color-dark-4)",
                    minHeight: "100px",
                    overflow: "auto",
                  }}
                >
                  {renderHighlightedText()}
                </Box>

                {/* Match Details */}
                {result.matches.length > 0 && (
                  <ScrollArea h={200}>
                    <Stack gap="xs">
                      {result.matches.map((match, index) => (
                        <Card key={index} p="xs" withBorder>
                          <Group justify="space-between">
                            <Text size="sm" fw={500}>
                              Match {index + 1}
                            </Text>
                            <Badge variant="light" size="sm">
                              {match.start}-{match.end}
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed">
                            "{match.match}" (length: {match.length})
                          </Text>
                        </Card>
                      ))}
                    </Stack>
                  </ScrollArea>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="groups" pt="md">
              {result.groups.length > 0 ? (
                <ScrollArea h={200}>
                  <Stack gap="xs">
                    {result.groups.map((group, index) => (
                      <Card key={index} p="xs" withBorder>
                        <Group justify="space-between">
                          <Text size="sm" fw={500}>
                            Group {group.index + 1}
                            {group.name && ` (${group.name})`}
                          </Text>
                          <Badge variant="light" size="sm">
                            {group.start}-{group.end}
                          </Badge>
                        </Group>
                        <Text size="sm" c="dimmed">
                          "{group.value}"
                        </Text>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea>
              ) : (
                <Text size="sm" c="dimmed">
                  No capturing groups found
                </Text>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="performance" pt="md">
              <Stack gap="sm" className={classes.performanceMetrics}>
                <Group justify="space-between">
                  <Text size="sm">Execution Time:</Text>
                  <Text size="sm" fw={500}>
                    {result.performance.executionTime.toFixed(2)}ms
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Iterations:</Text>
                  <Text size="sm" fw={500}>
                    {result.performance.iterations}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Match Count:</Text>
                  <Text size="sm" fw={500}>
                    {result.performance.matchCount}
                  </Text>
                </Group>
              </Stack>
            </Tabs.Panel>
          </Tabs>
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
