import { Stack, Text, Code, Box, Badge, Group } from "@mantine/core";
import classes from "./RegexAdvanced.module.css";

interface RegexDiagramProps {
  pattern: string;
}

export const RegexDiagram = ({ pattern }: RegexDiagramProps) => {
  const analyzePattern = (pattern: string) => {
    const components = [];
    let currentIndex = 0;

    while (currentIndex < pattern.length) {
      const char = pattern[currentIndex];

      if (char === "\\") {
        // Escape sequence
        const nextChar = pattern[currentIndex + 1];
        components.push({
          type: "escape",
          value: `\\${nextChar}`,
          description: getEscapeDescription(nextChar),
        });
        currentIndex += 2;
      } else if (char === "[") {
        // Character class
        const endIndex = pattern.indexOf("]", currentIndex);
        if (endIndex !== -1) {
          const charClass = pattern.slice(currentIndex, endIndex + 1);
          components.push({
            type: "charclass",
            value: charClass,
            description: "Character class",
          });
          currentIndex = endIndex + 1;
        } else {
          components.push({
            type: "literal",
            value: char,
            description: "Literal character",
          });
          currentIndex++;
        }
      } else if (char === "(") {
        // Group
        let groupEnd = currentIndex;
        let depth = 1;
        for (let i = currentIndex + 1; i < pattern.length; i++) {
          if (pattern[i] === "(") depth++;
          if (pattern[i] === ")") depth--;
          if (depth === 0) {
            groupEnd = i;
            break;
          }
        }
        const group = pattern.slice(currentIndex, groupEnd + 1);
        components.push({
          type: "group",
          value: group,
          description: "Capture group",
        });
        currentIndex = groupEnd + 1;
      } else if (["+", "*", "?", "{"].includes(char)) {
        // Quantifier
        let quantifier = char;
        if (char === "{") {
          const endIndex = pattern.indexOf("}", currentIndex);
          if (endIndex !== -1) {
            quantifier = pattern.slice(currentIndex, endIndex + 1);
            currentIndex = endIndex + 1;
          } else {
            currentIndex++;
          }
        } else {
          currentIndex++;
        }
        components.push({
          type: "quantifier",
          value: quantifier,
          description: getQuantifierDescription(quantifier),
        });
      } else if (["^", "$"].includes(char)) {
        // Anchor
        components.push({
          type: "anchor",
          value: char,
          description: getAnchorDescription(char),
        });
        currentIndex++;
      } else {
        // Literal character
        components.push({
          type: "literal",
          value: char,
          description: "Literal character",
        });
        currentIndex++;
      }
    }

    return components;
  };

  const getEscapeDescription = (char: string) => {
    const escapes: { [key: string]: string } = {
      d: "Any digit (0-9)",
      w: "Any word character",
      s: "Any whitespace",
      n: "Newline",
      t: "Tab",
      r: "Carriage return",
      b: "Word boundary",
      B: "Non-word boundary",
    };
    return escapes[char] || `Escaped ${char}`;
  };

  const getQuantifierDescription = (quantifier: string) => {
    const quantifiers: { [key: string]: string } = {
      "+": "One or more",
      "*": "Zero or more",
      "?": "Zero or one",
    };

    if (quantifier.startsWith("{")) {
      return `Specific quantity: ${quantifier}`;
    }

    return quantifiers[quantifier] || quantifier;
  };

  const getAnchorDescription = (anchor: string) => {
    const anchors: { [key: string]: string } = {
      "^": "Start of string",
      $: "End of string",
    };
    return anchors[anchor] || anchor;
  };

  const getColorForType = (type: string) => {
    const colors: { [key: string]: string } = {
      escape: "blue",
      charclass: "green",
      group: "orange",
      quantifier: "red",
      anchor: "purple",
      literal: "gray",
    };
    return colors[type] || "gray";
  };

  if (!pattern) {
    return (
      <Box className={classes.regexDiagram}>
        <Text size="sm" c="dimmed">
          Enter a regex pattern to see its visual diagram
        </Text>
      </Box>
    );
  }

  const components = analyzePattern(pattern);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="sm" fw={500}>
          Pattern Diagram
        </Text>
        <Badge variant="light" size="sm">
          Visual Analysis
        </Badge>
      </Group>

      <Box className={classes.regexDiagram}>
        <Stack gap="sm">
          {/* Visual representation */}
          <Group gap="xs" align="center">
            {components.map((component, index) => (
              <Badge
                key={index}
                variant="light"
                color={getColorForType(component.type)}
                size="lg"
                style={{ fontFamily: "monospace" }}
              >
                {component.value}
              </Badge>
            ))}
          </Group>

          {/* Detailed breakdown */}
          <Stack gap="xs" mt="md">
            <Text size="sm" fw={500}>
              Component Breakdown:
            </Text>
            {components.map((component, index) => (
              <Group key={index} gap="sm" align="flex-start">
                <Code c={getColorForType(component.type)} fz="sm">
                  {component.value}
                </Code>
                <Text size="xs" c="dimmed">
                  {component.description}
                </Text>
              </Group>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
};
