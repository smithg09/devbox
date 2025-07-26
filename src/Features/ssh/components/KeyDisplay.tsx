import { Alert, Badge, Box, Group, Stack, Text, Textarea, Grid, Button } from "@mantine/core";
import { BsShieldExclamation, BsArrowLeft } from "react-icons/bs";
import { CopyButton } from "@/Components/CopyButton";
import { GeneratedKeyPair } from "../types/ssh";

interface KeyDisplayProps {
  keys: GeneratedKeyPair;
  handleBack: () => void;
}

export function KeyDisplay({ keys, handleBack }: KeyDisplayProps) {
  const getAlgorithmColor = (algorithm: string) => {
    switch (algorithm) {
      case "rsa":
        return "blue";
      case "ed25519":
        return "green";
      default:
        return "gray";
    }
  };

  const getKeySizeColor = (keySize?: number) => {
    if (!keySize) return "gray";
    if (keySize >= 4096) return "green";
    if (keySize >= 2048) return "blue";
    if (keySize >= 1024) return "yellow";
    return "red";
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <Text fw={600}>Key Information</Text>
          <Badge color={getAlgorithmColor(keys.algorithm)} variant="light" size="sm">
            {keys.algorithm.toUpperCase()}
          </Badge>
          {keys.keySize && (
            <Badge color={getKeySizeColor(keys.keySize)} variant="light" size="sm">
              {keys.keySize} bits
            </Badge>
          )}
          <Badge color="gray" variant="light" size="sm">
            {keys.format.toUpperCase()}
          </Badge>
        </Group>
        <Button
          w="fit-content"
          variant="subtle"
          onClick={handleBack}
          leftSection={<BsArrowLeft size={16} />}
          size="xs"
        >
          Generate New Keys
        </Button>
      </Group>
      <Grid>
        <Grid.Col span={6}>
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text fw={600} size="sm" c="red">
                Private Key
              </Text>
              <CopyButton value={keys.privateKey} label="Copy Private Key" />
            </Group>
            <Textarea
              value={keys.privateKey}
              readOnly
              rows={6}
              styles={{
                input: {
                  fontFamily: "monospace",
                  fontSize: "11px",
                },
              }}
            />
          </Stack>
        </Grid.Col>
        <Grid.Col span={6}>
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text fw={600} size="sm" c="green">
                Public Key
              </Text>
              <CopyButton value={keys.publicKey} label="Copy Public Key" />
            </Group>
            <Textarea
              value={keys.publicKey}
              readOnly
              rows={6}
              styles={{
                input: {
                  fontFamily: "monospace",
                  fontSize: "11px",
                },
              }}
            />
          </Stack>
        </Grid.Col>
      </Grid>
      <Alert icon={<BsShieldExclamation />} color="red" variant="light">
        <Text size="xs">
          <strong>Keep this private key secure!</strong> Never share it or commit it to version
          control.
        </Text>
      </Alert>

      <Stack gap="md">
        <Group gap="sm">
          <Text fw={600} size="sm">
            Key Fingerprints
          </Text>
        </Group>
        <Box>
          <Text size="xs" c="dimmed" fw={500}>
            MD5 Fingerprint
          </Text>
          <Group justify="space-between" align="center">
            <Text size="sm" ff="monospace" c="dark">
              {keys.fingerprint.md5}
            </Text>
            <CopyButton value={keys.fingerprint.md5} label="Copy MD5" />
          </Group>
        </Box>
        <Box>
          <Text size="xs" c="dimmed" fw={500}>
            SHA256 Fingerprint
          </Text>
          <Group justify="space-between" align="center">
            <Text size="sm" ff="monospace" c="dark">
              {keys.fingerprint.sha256}
            </Text>
            <CopyButton value={keys.fingerprint.sha256} label="Copy SHA256" />
          </Group>
        </Box>
        {keys.comment && (
          <Box>
            <Text size="xs" c="dimmed" fw={500}>
              Comment
            </Text>
            <Text size="sm" c="dark">
              {keys.comment}
            </Text>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}
