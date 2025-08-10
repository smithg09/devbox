import {
  Button,
  Checkbox,
  Grid,
  Group,
  JsonInput,
  NativeSelect,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useCallback, useMemo, useState } from "react";

type RecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "TXT"
  | "MX"
  | "NS"
  | "SOA"
  | "SRV"
  | "CAA"
  | "PTR"
  | "ANY";

const RECORDS: { value: RecordType; label: string }[] = [
  { value: "A", label: "A" },
  { value: "AAAA", label: "AAAA" },
  { value: "CNAME", label: "CNAME" },
  { value: "TXT", label: "TXT" },
  { value: "MX", label: "MX" },
  { value: "NS", label: "NS" },
  { value: "SOA", label: "SOA" },
  { value: "SRV", label: "SRV" },
  { value: "CAA", label: "CAA" },
  { value: "PTR", label: "PTR" },
  { value: "ANY", label: "ANY" },
];

type DohResponse = {
  Answer?: Array<{ data: string; name: string; TTL: number; type: number }>;
  Authority?: Array<{ data: string; name: string; TTL: number; type: number }>;
  Additional?: Array<{ data: string; name: string; TTL: number; type: number }>;
  Comment?: string;
  Status: number;
};

const typeToNumber: Record<RecordType, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  SRV: 33,
  CAA: 257,
  PTR: 12,
  ANY: 255,
};

export default function DnsLookup() {
  const [domain, setDomain] = useState<string>("");
  const [recordType, setRecordType] = useState<RecordType>("A");
  const [results, setResults] = useState<DohResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolver, setResolver] = useState<string>("Google");
  const [dnssec, setDnssec] = useState<boolean>(false);

  const query = useCallback(async () => {
    const name = domain.trim();
    if (!name) {
      notifications.show({ title: "Input required", message: "Enter a domain", color: "red" });
      return;
    }
    // If PTR and looks like IPv4, convert to in-addr.arpa
    const queryName =
      recordType === "PTR" && /^(\d{1,3}\.){3}\d{1,3}$/.test(name)
        ? name.split(".").reverse().join(".") + ".in-addr.arpa"
        : name;
    setLoading(true);
    try {
      const endpoint = (() => {
        if (resolver === "Cloudflare") return "https://cloudflare-dns.com/dns-query";
        return "https://dns.google/resolve";
      })();
      const url = new URL(endpoint);
      url.searchParams.set("name", queryName);
      url.searchParams.set("type", String(typeToNumber[recordType]));
      if (dnssec) url.searchParams.set("cd", "0");
      const res = await fetch(url.toString(), { headers: { accept: "application/dns-json" } });
      const data: DohResponse = await res.json();
      setResults(data);
      if (!data.Answer && !data.Authority) {
        notifications.show({ title: "No records", message: "No results found", color: "yellow" });
      }
    } catch (e: any) {
      notifications.show({
        title: "Lookup failed",
        message: e?.message || String(e),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [domain, recordType, resolver, dnssec]);

  const rows = useMemo(() => {
    const answers = results?.Answer || [];
    return answers.map((r, idx) => (
      <Table.Tr key={idx}>
        <Table.Td>{r.name}</Table.Td>
        <Table.Td>{r.TTL}</Table.Td>
        <Table.Td>{r.data}</Table.Td>
      </Table.Tr>
    ));
  }, [results]);

  const authRows = useMemo(() => {
    const authorities = results?.Authority || [];
    return authorities.map((r, idx) => (
      <Table.Tr key={idx}>
        <Table.Td>{r.name}</Table.Td>
        <Table.Td>{r.TTL}</Table.Td>
        <Table.Td>{r.data}</Table.Td>
      </Table.Tr>
    ));
  }, [results]);

  const addRows = useMemo(() => {
    const additional = results?.Additional || [];
    return additional.map((r, idx) => (
      <Table.Tr key={idx}>
        <Table.Td>{r.name}</Table.Td>
        <Table.Td>{r.TTL}</Table.Td>
        <Table.Td>{r.data}</Table.Td>
      </Table.Tr>
    ));
  }, [results]);

  return (
    <Stack className="overflow-padding overflow-auto" h="100%" gap="md" pt="xl">
      <Title order={4}>DNS Lookup</Title>
      <Grid align="end">
        <Grid.Col span={6}>
          <TextInput
            label="Domain"
            placeholder="example.com"
            value={domain}
            onChange={e => setDomain(e.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <NativeSelect
            label="Record type"
            value={recordType}
            onChange={v => setRecordType((v.currentTarget.value as RecordType) || "A")}
            data={RECORDS}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <NativeSelect
            label="Resolver"
            value={resolver}
            onChange={v => setResolver((v.currentTarget.value as string) || "Google")}
            data={[
              { value: "Google", label: "Google" },
              { value: "Cloudflare", label: "Cloudflare" },
            ]}
          />
        </Grid.Col>
        <Grid.Col span={9}>
          <Checkbox
            label="Require DNSSEC (validate)"
            checked={dnssec}
            onChange={e => setDnssec(e.currentTarget.checked)}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Button loading={loading} onClick={query} fullWidth variant="light">
            Lookup
          </Button>
        </Grid.Col>
      </Grid>

      <Tabs defaultValue="answers">
        <Tabs.List>
          <Tabs.Tab value="answers">Answers</Tabs.Tab>
          <Tabs.Tab value="authority">Authority</Tabs.Tab>
          <Tabs.Tab value="additional">Additional</Tabs.Tab>
          <Tabs.Tab value="raw">Raw</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="answers" pt="xs">
          <Stack>
            <Group justify="space-between">
              <Text fw={600}>Answers</Text>
              {results?.Comment && (
                <Text size="xs" c="dimmed">
                  {results.Comment}
                </Text>
              )}
            </Group>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>TTL</Table.Th>
                  <Table.Th>Data</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="authority" pt="xs">
          <Stack>
            <Text fw={600}>Authority</Text>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>TTL</Table.Th>
                  <Table.Th>Data</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{authRows}</Table.Tbody>
            </Table>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="additional" pt="xs">
          <Stack>
            <Text fw={600}>Additional</Text>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>TTL</Table.Th>
                  <Table.Th>Data</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{addRows}</Table.Tbody>
            </Table>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="raw" pt="xs">
          <JsonInput
            formatOnBlur
            validationError="Invalid JSON"
            autosize
            minRows={12}
            value={results ? JSON.stringify(results, null, 2) : ""}
            readOnly
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
