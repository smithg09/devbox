import {
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { TbScissors } from "react-icons/tb";
import {
  Chunk,
  ChunkStrategy,
  chunkFixed,
  chunkRecursive,
  chunkSemantic,
  chunkSentence,
} from "./utils/chunker";

const DEMO_TEXT = `# Introduction to Retrieval-Augmented Generation

Retrieval-Augmented Generation (RAG) is a technique that combines information retrieval with text generation. Instead of relying solely on the knowledge encoded in model parameters, RAG systems retrieve relevant documents from an external knowledge base.

## How RAG Works

At its core, a RAG pipeline consists of three main components: a retriever, a knowledge base, and a generator. When a query arrives, the retriever searches the knowledge base for relevant passages. These passages are then provided as context to the language model.

### The Retrieval Step

The retrieval step typically uses dense embeddings or sparse BM25 indexing. Dense retrieval encodes both the query and documents as vectors in a high-dimensional space. Documents with vectors close to the query vector are considered relevant.

## Chunking Strategy

One of the most critical decisions in building a RAG pipeline is how to chunk the source documents. If chunks are too large, the context window fills up quickly. If chunks are too small, you lose important context that spans multiple sentences.

### Common Strategies

Fixed-size chunking splits text every N tokens regardless of semantic boundaries. Sentence-based chunking groups complete sentences until a size threshold is reached. Recursive chunking tries to split on natural boundaries like paragraphs or sections first.`;

const DEFAULT_SEPARATORS = ["\\n\\n", "\\n", ". ", " "];

export default function Chunking() {
  const [text, setText] = useState(DEMO_TEXT);
  const [strategy, setStrategy] = useState<ChunkStrategy>("recursive");
  const [chunkSize, setChunkSize] = useState(150);
  const [overlap, setOverlap] = useState(20);
  const [separatorsStr, setSeparatorsStr] = useState(DEFAULT_SEPARATORS.join(", "));
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const run = () => {
    const seps = separatorsStr
      .split(",")
      .map(s => s.trim().replace(/\\n/g, "\n").replace(/\\t/g, "\t"));

    let result: Chunk[];
    switch (strategy) {
      case "fixed":
        result = chunkFixed(text, chunkSize, overlap);
        break;
      case "sentence":
        result = chunkSentence(text, chunkSize, overlap);
        break;
      case "recursive":
        result = chunkRecursive(text, chunkSize, overlap, seps);
        break;
      case "semantic":
        result = chunkSemantic(text, chunkSize, overlap);
        break;
    }
    setChunks(result);
    setSelectedIdx(null);
  };

  const totalTokens = chunks.reduce((s, c) => s + c.tokenCount, 0);
  const avgTokens = chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0;
  const minTokens = chunks.length > 0 ? Math.min(...chunks.map(c => c.tokenCount)) : 0;
  const maxTokens = chunks.length > 0 ? Math.max(...chunks.map(c => c.tokenCount)) : 0;

  return (
    <Stack className="overflow-padding" h="100%" gap="sm">
      <Group gap="xs">
        <TbScissors size={18} />
        <Title order={4}>Chunking Playground</Title>
      </Group>

      <Group align="start" h="100%" gap="md" wrap="nowrap" style={{ flex: 1, overflow: "hidden" }}>
        <Stack w={340} gap="sm" h="100%" style={{ overflow: "hidden" }}>
          <ScrollArea style={{ flex: 1 }} type="auto">
            <Stack gap="sm" pr={4}>
              <Stack gap="xs">
                <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                  Strategy
                </Text>
                <SegmentedControl
                  size="xs"
                  value={strategy}
                  onChange={v => setStrategy(v as ChunkStrategy)}
                  data={[
                    { label: "Fixed", value: "fixed" },
                    { label: "Sentence", value: "sentence" },
                    { label: "Recursive", value: "recursive" },
                    { label: "Semantic", value: "semantic" },
                  ]}
                />
              </Stack>
              <Group gap="xs">
                <NumberInput
                  label="Chunk size (tokens)"
                  value={chunkSize}
                  onChange={v => setChunkSize(Number(v))}
                  min={10}
                  max={4096}
                  size="xs"
                  style={{ flex: 1 }}
                />
                <NumberInput
                  label="Overlap (tokens)"
                  value={overlap}
                  onChange={v => setOverlap(Number(v))}
                  min={0}
                  max={512}
                  size="xs"
                  style={{ flex: 1 }}
                />
              </Group>
              {strategy === "recursive" && (
                <TextInput
                  label="Separators (comma-separated)"
                  value={separatorsStr}
                  onChange={e => setSeparatorsStr(e.currentTarget.value)}
                  size="xs"
                  styles={{ input: { fontFamily: "monospace" } }}
                  description="Use \\n for newline, \\n\\n for paragraph"
                />
              )}
              <Button size="sm" variant="filled" onClick={run}>
                Chunk it
              </Button>
              <Textarea
                label="Document"
                value={text}
                onChange={e => setText(e.currentTarget.value)}
                minRows={10}
                autosize
                styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
              />
            </Stack>
          </ScrollArea>
        </Stack>

        <Stack style={{ flex: 1, height: "100%" }} gap="sm">
          {chunks.length > 0 && (
            <Group gap="md">
              <Badge size="sm" variant="outline">
                {chunks.length} chunks
              </Badge>
              <Badge size="sm" variant="outline" color="blue">
                avg {avgTokens} tokens
              </Badge>
              <Badge size="sm" variant="outline" color="green">
                min {minTokens}
              </Badge>
              <Badge size="sm" variant="outline" color="orange">
                max {maxTokens}
              </Badge>
            </Group>
          )}
          <ScrollArea style={{ flex: 1 }}>
            <Stack gap={6}>
              {chunks.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" mt="xl">
                  Paste a document and click Chunk it to see results
                </Text>
              ) : (
                chunks.map(chunk => (
                  <Paper
                    key={chunk.index}
                    p="sm"
                    radius="sm"
                    withBorder
                    style={{
                      cursor: "pointer",
                      borderColor:
                        selectedIdx === chunk.index ? "var(--mantine-color-blue-5)" : undefined,
                    }}
                    onClick={() => setSelectedIdx(selectedIdx === chunk.index ? null : chunk.index)}
                  >
                    <Group justify="space-between" mb={4}>
                      <Badge size="xs" variant="light">
                        #{chunk.index + 1}
                      </Badge>
                      <Group gap="xs">
                        <Badge size="xs" color="blue" variant="dot">
                          {chunk.tokenCount} tokens
                        </Badge>
                        <Badge size="xs" color="gray" variant="dot">
                          {chunk.charCount} chars
                        </Badge>
                      </Group>
                    </Group>
                    <Text
                      size="xs"
                      style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}
                      lineClamp={selectedIdx === chunk.index ? undefined : 3}
                    >
                      {chunk.text}
                    </Text>
                  </Paper>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Group>
    </Stack>
  );
}
