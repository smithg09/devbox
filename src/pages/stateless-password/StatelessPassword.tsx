import { CopyButton } from "@/components/CopyButton";
import { settingsStore } from "@/utils/store";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  NumberInput,
  PasswordInput,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { generatePassword } from "lesspass";
import { useCallback, useEffect, useState } from "react";
import { BsPlus, BsShieldCheck, BsTrash } from "react-icons/bs";

export type StatelessPassEntries = {
  site: string;
  login: string;
  version: number;
  length: number;
  options: {
    upper: boolean;
    lower: boolean;
    digits: boolean;
    symbols: boolean;
  };
}[];

export default function StatelessPassword() {
  const [master, setMaster] = useState("");
  const [site, setSite] = useState("");
  const [login, setLogin] = useState("");
  const [version, setVersion] = useState(1);
  const [length, setLength] = useState(16);
  // Options
  const [options, setOptions] = useState({
    upper: true,
    lower: true,
    digits: true,
    symbols: false,
  });

  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<StatelessPassEntries>([]);

  const [debouncedMaster] = useDebouncedValue(master, 300);
  const [debouncedSite] = useDebouncedValue(site, 300);
  const [debouncedLogin] = useDebouncedValue(login, 300);
  const [debouncedLength] = useDebouncedValue(length, 300);

  useEffect(() => {
    (async () => {
      const entries = (await settingsStore.get("statelessPasswords")) as StatelessPassEntries;
      if (entries) {
        setEntries(entries ?? []);
      }
    })();
  }, []);

  const saveEntry = useCallback(() => {
    if (!site || !login) return;
    setEntries(prev => {
      const filtered = prev.filter(e => !(e.site === site && e.login === login));
      const update = [
        {
          site: site,
          login: login,
          version,
          length: debouncedLength,
          options: options,
        },
        ...filtered,
      ].slice(0, 50);

      settingsStore.update("statelessPasswords", update);
      return update;
    });
  }, [site, login, version]);

  const deleteEntry = useCallback((entry: { site: string; login: string; version: number }) => {
    setEntries(prev => {
      const filtered = prev.filter(
        e => !(e.site === entry.site && e.login === entry.login && e.version === entry.version)
      );

      settingsStore.update("statelessPasswords", filtered);
      return filtered;
    });
  }, []);

  const generateStatelessPass = useCallback(async () => {
    setError(null);
    if (!debouncedMaster || !debouncedSite || !debouncedLogin) {
      setGeneratedPassword(null);
      return;
    }
    if (!(options.upper || options.lower || options.digits || options.symbols)) {
      setError("Select at least one character class");
      return;
    }
    try {
      const opts: any = {
        length: debouncedLength,
        counter: version,
        lowercase: options.lower,
        uppercase: options.upper,
        digits: options.digits,
        symbols: options.symbols,
      };

      const password: string = await generatePassword(
        {
          site: debouncedSite,
          login: debouncedLogin,
          ...opts,
        },
        debouncedMaster
      );
      setGeneratedPassword(password);
    } catch (e: any) {
      setError(e?.message || "Failed to generate password");
    }
  }, [
    debouncedMaster,
    debouncedSite,
    debouncedLogin,
    version,
    debouncedLength,
    options,
    length,
    saveEntry,
  ]);

  useEffect(() => {
    generateStatelessPass();
  }, [generateStatelessPass]);

  return (
    <Stack h="100%" className="overflow-padding overflow-auto">
      <Text size="sm" c="dimmed" maw={860}>
        Generate unique, strong site passwords locally from a single master password. Nothing is
        stored except your preferences locally. Change the version to rotate a site password.
      </Text>
      <Stack gap="sm">
        <Group>
          <TextInput
            flex={1}
            label="Site / Identifier"
            value={site}
            onChange={e => setSite(e.currentTarget.value)}
            placeholder="example.com"
            description="Domain or context. Case-insensitive."
            required
          />
          <TextInput
            flex={1}
            label="Login / Username"
            value={login}
            onChange={e => setLogin(e.currentTarget.value)}
            placeholder="user@example.com"
            description="Login, email, or username for this site."
            required
          />
        </Group>
        <PasswordInput
          label="Master Password"
          value={master}
          onChange={e => setMaster(e.currentTarget.value)}
          placeholder="Enter your main secret"
          required
          autoComplete="off"
          description="Not stored. Keep this safe."
        />
        <Group flex={1} grow align="flex-end">
          <Stack miw="fit-content" gap={12}>
            <Text size="sm" fw={450}>
              Character Classes
              <Text size="xs" c="dimmed" fw={400}>
                (at least one must be selected)
              </Text>
            </Text>
            <Group wrap="nowrap" miw="fit-content" flex={1} mt={8}>
              <Checkbox
                size="xs"
                label="A-Z"
                checked={options.upper}
                onChange={e => setOptions({ ...options, upper: e.currentTarget.checked })}
              />
              <Checkbox
                size="xs"
                label="a-z"
                checked={options.lower}
                onChange={e => setOptions({ ...options, lower: e.currentTarget.checked })}
              />
              <Checkbox
                size="xs"
                label="0-9"
                checked={options.digits}
                onChange={e => setOptions({ ...options, digits: e.currentTarget.checked })}
              />
              <Checkbox
                size="xs"
                label="Symbols"
                checked={options.symbols}
                onChange={e => setOptions({ ...options, symbols: e.currentTarget.checked })}
              />
            </Group>
          </Stack>
          <NumberInput
            label="Length"
            value={length}
            min={6}
            max={64}
            flex={1}
            onChange={val => setLength(Number(val) || 16)}
            description="Higher is more secure"
          />
          <NumberInput
            label="Version"
            value={version}
            min={1}
            max={99}
            flex={1}
            onChange={val => setVersion(Number(val) || 1)}
            description="Bump to rotate"
          />
        </Group>
        {error && <Alert color="red" variant="light" title={error} />}
      </Stack>
      <Divider my={12} />
      <Box style={{ flex: 1 }}>
        {generatedPassword ? (
          <Stack gap={4}>
            <Text size="md" fw={500} mb={4}>
              Generated Password
            </Text>
            <Group gap={4} wrap="nowrap">
              <TextInput value={generatedPassword} readOnly style={{ flex: 1 }} />
              <CopyButton
                label="Copy"
                variant="light"
                size="sm"
                fullWidth={false}
                value={generatedPassword}
              />
              <Button
                size="sm"
                variant="light"
                leftSection={<BsPlus size={18} />}
                onClick={saveEntry}
                disabled={!site || !login}
                title={!site || !login ? "Enter site & login" : "Store site/login/version locally"}
              >
                Save Preferences
              </Button>
            </Group>
            <Text size="xs" c="dimmed">
              Deterministic output – same inputs always produce the same password.
            </Text>
            <Alert mt="xs" color="green" variant="light" icon={<BsShieldCheck />}>
              Remember to update saved passwords elsewhere if you change length, symbols, or
              version.
            </Alert>
          </Stack>
        ) : (
          <Alert variant="light" color="gray">
            Enter master password, site, and login to generate a password.
          </Alert>
        )}
        <Stack gap={12} mt="lg">
          <Text fw={600} size="sm" mb={2}>
            Saved Preferences
          </Text>
          <Table
            striped
            withRowBorders
            withColumnBorders
            withTableBorder
            styles={{
              table: {
                borderRadius: 12,
              },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Site</Table.Th>
                <Table.Th>Login</Table.Th>
                <Table.Th>Version</Table.Th>
                <Table.Th>Length</Table.Th>
                <Table.Th>Character Classes</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {entries.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: "center", color: "#888" }}>
                    No entries yet
                  </Table.Td>
                </Table.Tr>
              ) : (
                entries.map((entry, idx) => (
                  <Table.Tr key={entry.site + entry.login + entry.version + idx}>
                    <Table.Td>{entry.site}</Table.Td>
                    <Table.Td>{entry.login}</Table.Td>
                    <Table.Td>{entry.version}</Table.Td>
                    <Table.Td>{entry.length}</Table.Td>
                    <Table.Td>
                      {Object.keys(entry.options)
                        .filter(key => entry.options[key as keyof typeof entry.options])
                        .join(", ")}
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => {
                          setSite(entry.site);
                          setLogin(entry.login);
                          setVersion(entry.version);
                          setLength(entry.length);
                          setOptions(entry.options);
                        }}
                      >
                        Regenerate
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        leftSection={<BsTrash />}
                        onClick={() => deleteEntry(entry)}
                        ml={4}
                      >
                        Remove
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      </Box>
    </Stack>
  );
}
