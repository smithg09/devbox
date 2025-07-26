import { Alert, Badge, Box, Card, Group, Stack, Text, Title } from "@mantine/core";
import { BsCheckCircle, BsExclamationTriangle, BsInfoCircle, BsKey } from "react-icons/bs";
import { CopyButton } from "@/Components/CopyButton";
import { KeyInfo } from "../types/ssh";

interface KeyInspectorProps {
  keyInfo: KeyInfo;
}

export function KeyInspector({ keyInfo }: KeyInspectorProps) {
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

  const getSecurityLevel = (algorithm: string, keySize?: number) => {
    if (algorithm === "ed25519") {
      return { level: "Excellent", color: "green" };
    }
    if (algorithm === "rsa") {
      if (!keySize) return { level: "Unknown", color: "gray" };
      if (keySize >= 4096) return { level: "Excellent", color: "green" };
      if (keySize >= 2048) return { level: "Good", color: "blue" };
      if (keySize >= 1024) return { level: "Weak", color: "yellow" };
      return { level: "Very Weak", color: "red" };
    }
    return { level: "Unknown", color: "gray" };
  };

  const security = getSecurityLevel(keyInfo.type, keyInfo.keySize);

  if (!keyInfo.isValid) {
    return (
      <Alert icon={<BsExclamationTriangle />} color="red" title="Invalid Key" variant="light">
        {keyInfo.errorMessage || "The provided key is not valid."}
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Alert icon={<BsCheckCircle />} color="green" title="Valid SSH Key" variant="light">
        The key has been successfully validated and analyzed.
      </Alert>

      <Card withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <BsKey size={20} />
              <Title order={4}>Key Information</Title>
            </Group>
            <Group gap="xs">
              <Badge color={getAlgorithmColor(keyInfo.type)} variant="light">
                {keyInfo.type.toUpperCase()}
              </Badge>
              {keyInfo.keySize && (
                <Badge color={getKeySizeColor(keyInfo.keySize)} variant="light">
                  {keyInfo.keySize} bits
                </Badge>
              )}
              <Badge color="gray" variant="light">
                {keyInfo.format.toUpperCase()}
              </Badge>
            </Group>
          </Group>

          <Box>
            <Text size="sm" fw={500} mb="xs">
              Security Level
            </Text>
            <Badge color={security.color} size="lg" variant="light">
              {security.level}
            </Badge>
          </Box>

          <Box>
            <Text size="sm" fw={500} mb="xs">
              Key Type & Size
            </Text>
            <Text size="sm" c="dimmed">
              {keyInfo.type.toUpperCase()}
              {keyInfo.keySize && ` ${keyInfo.keySize}-bit`}
            </Text>
          </Box>

          <Box>
            <Text size="sm" fw={500} mb="xs">
              MD5 Fingerprint
            </Text>
            <Group justify="space-between">
              <Text size="sm" ff="monospace">
                {keyInfo.fingerprint.md5}
              </Text>
              <CopyButton value={keyInfo.fingerprint.md5} label="Copy MD5" />
            </Group>
          </Box>

          <Box>
            <Text size="sm" fw={500} mb="xs">
              SHA256 Fingerprint
            </Text>
            <Group justify="space-between">
              <Text size="sm" ff="monospace">
                {keyInfo.fingerprint.sha256}
              </Text>
              <CopyButton value={keyInfo.fingerprint.sha256} label="Copy SHA256" />
            </Group>
          </Box>

          {keyInfo.comment && (
            <Box>
              <Text size="sm" fw={500} mb="xs">
                Comment
              </Text>
              <Text size="sm">{keyInfo.comment}</Text>
            </Box>
          )}
        </Stack>
      </Card>

      {keyInfo.type === "rsa" && keyInfo.keySize && keyInfo.keySize < 2048 && (
        <Alert
          icon={<BsExclamationTriangle />}
          color="yellow"
          title="Security Warning"
          variant="light"
        >
          <Text size="sm">
            This RSA key size ({keyInfo.keySize} bits) is considered weak by modern standards.
            Consider generating a new key with at least 2048 bits.
          </Text>
        </Alert>
      )}

      <Alert icon={<BsInfoCircle />} color="blue" title="Usage Tips" variant="light">
        <Text size="sm">
          • Use the SHA256 fingerprint for modern systems • The MD5 fingerprint is provided for
          legacy compatibility • Always verify fingerprints when connecting to new servers
        </Text>
      </Alert>
    </Stack>
  );
}
