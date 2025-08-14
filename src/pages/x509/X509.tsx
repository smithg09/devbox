import { CopyButton } from "@/components/CopyButton";
import { useFile } from "@/hooks/useFile";
import { openFileAndGetData, saveDataToFile } from "@/utils/functions";
import {
  ActionIcon,
  Button,
  Grid,
  Group,
  JsonInput,
  Paper,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useCallback, useMemo, useState } from "react";
import { BsDownload } from "react-icons/bs";
import { parseDerCertificate, parsePemCertificate, splitPemBlocks } from "./utils";

import type { ParsedCertificate } from "./utils";

function isPem(input: string): boolean {
  return input.includes("-----BEGIN ");
}

export default function X509() {
  const [input, setInput] = useState<string>("");
  const [items, setItems] = useState<ParsedCertificate[]>([]);
  const { openFile } = useFile({ extensions: ["pem", "cer", "crt"] });

  const parseNow = useCallback(async () => {
    try {
      const text = input.trim();
      const results: ParsedCertificate[] = [];
      if (!text) {
        notifications.show({
          title: "Input required",
          message: "Paste PEM or open a file",
          color: "yellow",
        });
        return;
      }
      if (isPem(text)) {
        const blocks = splitPemBlocks(text);
        for (const block of blocks) {
          const parsed = await parsePemCertificate(block);
          results.push(parsed);
        }
      } else {
        // Assume base64 or hex? For MVP, treat as DER if non-empty binary provided via file open
        notifications.show({
          title: "Format not recognized",
          message: "Provide PEM blocks or use file open for DER",
          color: "yellow",
        });
        return;
      }
      setItems(results);
      if (!results.length) {
        notifications.show({
          title: "No certificates found",
          message: "Ensure PEM contains BEGIN/END blocks",
          color: "red",
        });
      }
    } catch (e: any) {
      notifications.show({ title: "Parse error", message: e?.message || String(e), color: "red" });
    }
  }, [input]);

  const handleOpen = useCallback(async () => {
    try {
      await openFile(data => setInput(data));
    } catch (e: any) {
      // Already notified in util
    }
  }, [openFile]);

  const handleOpenDer = useCallback(async () => {
    try {
      const der = await openFileAndGetData(
        "Open a DER certificate",
        [{ name: "DER", extensions: ["der", "cer", "crt"] }],
        "binary"
      );
      const parsed = await parseDerCertificate(der);
      setItems([parsed]);
      setInput("");
    } catch (e) {
      // notification already handled by util on cancel
    }
  }, []);

  const exportPem = useCallback(
    async (idx: number) => {
      const item = items[idx];
      if (!item) return;
      const pem = item.pem || "";
      await saveDataToFile(
        pem,
        "Save certificate PEM",
        [{ name: "PEM", extensions: ["pem", "crt", "cer"] }],
        {
          title: "Saved",
          message: "Certificate saved as PEM",
        }
      );
    },
    [items]
  );

  const exportDer = useCallback(
    async (idx: number) => {
      const item = items[idx];
      if (!item) return;
      const der = item.der;
      if (!der) return;
      const b64 = btoa(String.fromCharCode(...der));
      const contents = `-----BEGIN DER-----\n${b64}\n-----END DER-----`;
      await saveDataToFile(
        contents,
        "Save certificate DER (Base64)",
        [{ name: "DER", extensions: ["der"] }],
        {
          title: "Saved",
          message: "Certificate saved in base64-encoded DER wrapper",
        }
      );
    },
    [items]
  );

  const dnToString = (dn?: Record<string, string>) => {
    if (!dn) return "";
    const order = ["CN", "O", "OU", "C", "ST", "L", "emailAddress"]; // common names
    const entries = Object.entries(dn);
    entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    return entries.map(([k, v]) => `${k}=${v}`).join(", ");
  };

  const tabs = useMemo(
    () => (
      <Tabs defaultValue={items.length ? "0" : undefined} keepMounted={false}>
        <Tabs.List>
          {items.map((_, i) => (
            <Tabs.Tab key={i} value={String(i)}>{`Item ${i + 1}`}</Tabs.Tab>
          ))}
          {!!items.length && <Tabs.Tab value="raw">Raw</Tabs.Tab>}
        </Tabs.List>

        {items.map((c, i) => (
          <Tabs.Panel key={i} value={String(i)} pt="xs">
            <Paper p="md" withBorder>
              <Stack>
                <Group justify="space-between">
                  <Group gap={8}>
                    <Text fw={600}>{c.type === "csr" ? "Certificate Request" : "Certificate"}</Text>
                  </Group>
                  <Group gap="xs">
                    <Tooltip label="Export PEM">
                      <ActionIcon variant="light" onClick={() => exportPem(i)}>
                        <BsDownload />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Export DER (base64-wrapped)">
                      <ActionIcon variant="light" onClick={() => exportDer(i)}>
                        <BsDownload />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>

                <Grid>
                  <Grid.Col span={12}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Subject
                      </Text>
                      <CopyButton
                        value={dnToString(c.subject)}
                        size="xs"
                        variant="subtle"
                        label="Copy"
                        fullWidth={false}
                      />
                    </Group>
                    <Textarea autosize minRows={1} readOnly value={dnToString(c.subject)} />
                  </Grid.Col>
                  {c.type === "cert" && (
                    <Grid.Col span={12}>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Issuer
                        </Text>
                        <CopyButton
                          value={dnToString(c.issuer)}
                          size="xs"
                          variant="subtle"
                          label="Copy"
                          fullWidth={false}
                        />
                      </Group>
                      <Textarea autosize minRows={1} readOnly value={dnToString(c.issuer)} />
                    </Grid.Col>
                  )}
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Serial
                    </Text>
                    <Textarea autosize minRows={1} readOnly value={c.serialHex || ""} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Version
                      </Text>
                    </Group>
                    <Textarea autosize minRows={1} readOnly value={String(c.version || "")} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Not Before
                      </Text>
                    </Group>
                    <Textarea autosize minRows={1} readOnly value={c.validFrom || ""} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Not After
                      </Text>
                    </Group>
                    <Textarea autosize minRows={1} readOnly value={c.validTo || ""} />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Signature Algorithm
                      </Text>
                    </Group>
                    <Textarea autosize minRows={1} readOnly value={c.signatureAlgorithm || ""} />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Public Key
                      </Text>
                    </Group>
                    <Textarea
                      autosize
                      minRows={1}
                      readOnly
                      value={
                        c.publicKey
                          ? `${c.publicKey.type}${c.publicKey.sizeBits ? ` ${c.publicKey.sizeBits} bits` : ""}${c.publicKey.details?.curve ? ` (${c.publicKey.details.curve})` : ""}`
                          : ""
                      }
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={12}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        SHA-256
                      </Text>
                      <CopyButton
                        value={c.fingerprints?.sha256 || ""}
                        size="xs"
                        variant="subtle"
                        label="Copy"
                        fullWidth={false}
                      />
                    </Group>
                    <Textarea autosize minRows={2} readOnly value={c.fingerprints?.sha256 || ""} />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        SHA-1
                      </Text>
                      <CopyButton
                        value={c.fingerprints?.sha1 || ""}
                        size="xs"
                        variant="subtle"
                        label="Copy"
                        fullWidth={false}
                      />
                    </Group>
                    <Textarea autosize minRows={2} readOnly value={c.fingerprints?.sha1 || ""} />
                  </Grid.Col>
                </Grid>

                {c.extensions && c.extensions.length > 0 && (
                  <Stack>
                    <Text fw={600}>Extensions</Text>
                    <Table withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>OID</Table.Th>
                          <Table.Th>Value</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {c.extensions.map((ext, idx) => (
                          <Table.Tr key={idx}>
                            <Table.Td>{ext.name || "(unknown)"}</Table.Td>
                            <Table.Td>{ext.oid}</Table.Td>
                            <Table.Td>
                              <Textarea
                                autosize
                                minRows={1}
                                readOnly
                                value={(() => {
                                  try {
                                    if (
                                      (ext.name === "subjectAltName" ||
                                        ext.name === "subjectAltName (2.5.29.17)") &&
                                      (ext as any).value?.altNames
                                    ) {
                                      return (ext as any).value.altNames
                                        .map(
                                          (n: any) =>
                                            `${n.type === 2 ? "DNS" : n.type === 7 ? "IP" : n.type}: ${n.value}`
                                        )
                                        .join(", ");
                                    }
                                    return typeof ext.value === "string"
                                      ? ext.value
                                      : JSON.stringify(ext.value, null, 2);
                                  } catch {
                                    return String(ext.value ?? "");
                                  }
                                })()}
                              />
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Tabs.Panel>
        ))}

        {!!items.length && (
          <Tabs.Panel value="raw" pt="xs">
            <JsonInput autosize minRows={12} value={JSON.stringify(items, null, 2)} readOnly />
          </Tabs.Panel>
        )}
      </Tabs>
    ),
    [items, exportPem, exportDer]
  );

  return (
    <Stack className="overflow-padding overflow-auto" h="100%" gap="md">
      <Group gap="xs">
        <Button variant="light" size="xs" onClick={handleOpen}>
          Open PEM
        </Button>
        <Button variant="light" size="xs" onClick={handleOpenDer}>
          Open DER
        </Button>
      </Group>
      <Textarea
        rows={10}
        value={input}
        onChange={e => setInput(e.currentTarget.value)}
        placeholder={`Paste one or more PEM blocks, e.g.\n-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----`}
      />
      <Button
        onClick={parseNow}
        variant="light"
        size="xs"
        fullWidth
        styles={{ root: { overflow: "visible" } }}
      >
        Decode
      </Button>

      {items.length > 0 ? (
        tabs
      ) : (
        <Paper p="md" withBorder>
          <Text size="sm" c="dimmed">
            Decoded results will appear here.
          </Text>
        </Paper>
      )}
    </Stack>
  );
}
