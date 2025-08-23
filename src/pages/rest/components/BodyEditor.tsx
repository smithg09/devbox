import { monacoOnMountHandler } from "@/components/Monaco/utils";
import {
  Group,
  Radio,
  Table,
  ActionIcon,
  Tooltip,
  Button,
  FileButton,
  Box,
  TextInput,
} from "@mantine/core";
import Editor from "@monaco-editor/react";
import { useMemo } from "react";
import { BodyMode, RequestBody, KeyValue } from "../types/rest";
import ParamsHeadersEditor from "./ParamsHeadersEditor";
import { BsPlus, BsTrash3 } from "react-icons/bs";

type Props = {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
};

const modes: BodyMode[] = ["none", "json", "xml", "text", "multipart"];

export default function BodyEditor({ body, onChange }: Props) {
  const language = useMemo(() => {
    if (body.mode === "json") return "json";
    if (body.mode === "xml") return "xml";
    if (body.mode === "text") return "plaintext";
    return "plaintext";
  }, [body.mode]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Group justify="space-between">
        <Radio.Group
          size="xs"
          value={body.mode}
          onChange={v => {
            if (v === "none") {
              onChange({ mode: "none" });
              return;
            }
            if (v === "multipart") {
              onChange({
                mode: "multipart",
                fields: (body as any).fields || [],
                files: (body as any).files || [],
              });
              return;
            }
            onChange({
              mode: v as Exclude<BodyMode, "none" | "multipart">,
              text: (body as any).text || "",
            });
          }}
          name="body-mode"
        >
          <Group mt="xs">
            {modes.map(m => (
              <Radio key={m} value={m} label={m.toUpperCase()} />
            ))}
          </Group>
        </Radio.Group>
      </Group>

      {body.mode !== "none" && (
        <div
          style={{
            flex: 1,
            minHeight: 180,
          }}
        >
          {body.mode === "json" || body.mode === "xml" || body.mode === "text" ? (
            <Box
              h="100%"
              w="100%"
              style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
            >
              <Editor
                height="100%"
                defaultLanguage={language}
                value={(body as any).text || ""}
                onChange={value => onChange({ ...(body as any), text: value || "" })}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                }}
                onMount={monacoOnMountHandler}
              />
            </Box>
          ) : null}
          {body.mode === "multipart" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ParamsHeadersEditor
                title="Multipart Fields"
                rows={(body as any).fields || []}
                onChange={(rows: KeyValue[]) => onChange({ ...(body as any), fields: rows })}
              />
              <Group justify="space-between" style={{ marginBottom: 8 }}>
                <strong>Files</strong>
                <Tooltip label="Add file">
                  <ActionIcon
                    variant="default"
                    onClick={() => {
                      const files = (body as any).files || [];
                      const next = [
                        ...files,
                        { id: crypto.randomUUID(), field: "", name: "", file: undefined },
                      ];
                      onChange({ ...(body as any), files: next });
                    }}
                  >
                    <BsPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Table striped withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Field</Table.Th>
                    <Table.Th>File</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {((body as any).files || []).map((f: any) => (
                    <Table.Tr key={f.id}>
                      <Table.Td>
                        <TextInput
                          value={f.field}
                          placeholder="field name"
                          onChange={e => {
                            const files = (body as any).files || [];
                            onChange({
                              ...(body as any),
                              files: files.map((x: any) =>
                                x.id === f.id ? { ...x, field: e.currentTarget.value } : x
                              ),
                            });
                          }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group>
                          <div>{f.name || (f.file && f.file.name) || "(no file)"}</div>
                          <FileButton
                            onChange={file => {
                              const files = (body as any).files || [];
                              onChange({
                                ...(body as any),
                                files: files.map((x: any) =>
                                  x.id === f.id ? { ...x, file, name: file?.name || x.name } : x
                                ),
                              });
                            }}
                          >
                            {props => (
                              <Button size="xs" {...props}>
                                Choose
                              </Button>
                            )}
                          </FileButton>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ width: 56 }}>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => {
                            const files = (body as any).files || [];
                            onChange({
                              ...(body as any),
                              files: files.filter((x: any) => x.id !== f.id),
                            });
                          }}
                        >
                          <BsTrash3 size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
