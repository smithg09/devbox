import { Alert, Button, Card, Group, Stack, Text, Textarea, Title } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { BsSearch, BsInfoCircle } from "react-icons/bs";
import { useKeyValidation } from "../hooks/useKeyValidation";
import { KeyInspector } from "./KeyInspector";

export function AnalyzeTab() {
  const [keyData, setKeyData] = useInputState("");
  const { keyInfo, isValidating, validateKey, clearValidation } = useKeyValidation();

  const handleAnalyze = async () => {
    await validateKey(keyData);
  };

  const handleClear = () => {
    setKeyData("");
    clearValidation();
  };

  const isKeyDataValid = keyData.trim().length > 0;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <BsSearch size={20} />
          <Title order={3}>Analyze SSH Key</Title>
        </Group>
        <Group gap="xs">
          <Button variant="outline" onClick={handleClear} disabled={!isKeyDataValid && !keyInfo}>
            Clear
          </Button>
          <Button
            leftSection={<BsSearch />}
            onClick={handleAnalyze}
            loading={isValidating}
            disabled={!isKeyDataValid}
          >
            Analyze Key
          </Button>
        </Group>
      </Group>

      <Card withBorder>
        <Stack gap="md">
          <Text fw={500} size="sm">
            SSH Key Input
          </Text>

          <Textarea
            label="Paste your SSH key here"
            description="Supports both public and private keys in OpenSSH or PEM format"
            value={keyData}
            onChange={e => setKeyData(e.target.value)}
            placeholder={`Paste your SSH key here, for example:

ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... user@hostname

or

-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`}
            rows={8}
            styles={{
              input: {
                fontFamily: "monospace",
                fontSize: "12px",
              },
            }}
          />

          <Alert icon={<BsInfoCircle />} color="blue" variant="light">
            <Text size="sm">
              <strong>Privacy Notice:</strong> Key analysis is performed locally in your browser. No
              data is sent to external servers.
            </Text>
          </Alert>
        </Stack>
      </Card>

      {keyInfo && <KeyInspector keyInfo={keyInfo} />}

      {!keyInfo && isKeyDataValid && (
        <Alert color="gray" variant="light">
          <Text size="sm">
            Click {'"'}Analyze Key{'"'} to validate and inspect your SSH key.
          </Text>
        </Alert>
      )}
    </Stack>
  );
}
