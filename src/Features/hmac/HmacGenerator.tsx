import { CopyButton } from "@/Components/CopyButton";
import {
  Button,
  Grid,
  Group,
  NativeSelect,
  PasswordInput,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useCallback, useMemo, useState } from "react";

type Algo = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

async function computeHmac(
  algorithm: Algo,
  key: string,
  message: string,
  output: "hex" | "base64"
) {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const msgData = enc.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: algorithm } },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const bytes = new Uint8Array(signature);
  if (output === "base64") {
    const bin = Array.from(bytes)
      .map(b => String.fromCharCode(b))
      .join("");
    return btoa(bin);
  }
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function HmacGenerator() {
  const [algorithm, setAlgorithm] = useState<Algo>("SHA-256");
  const [key, setKey] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [output, setOutput] = useState<"hex" | "base64">("hex");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    if (!key) {
      notifications.show({ title: "Key required", message: "Enter a secret key", color: "red" });
      return;
    }
    setLoading(true);
    try {
      const sig = await computeHmac(algorithm, key, message, output);
      setResult(sig);
    } catch (e: any) {
      notifications.show({ title: "Error", message: e?.message || String(e), color: "red" });
    } finally {
      setLoading(false);
    }
  }, [algorithm, key, message, output]);

  const algoOptions = useMemo(
    () => [
      { value: "SHA-1", label: "HMAC-SHA1" },
      { value: "SHA-256", label: "HMAC-SHA256" },
      { value: "SHA-384", label: "HMAC-SHA384" },
      { value: "SHA-512", label: "HMAC-SHA512" },
    ],
    []
  );

  return (
    <Stack className="overflow-padding" h="100%" gap="md" pt="xl">
      <Title order={4}>HMAC Generator</Title>
      <Grid align="end">
        <Grid.Col span={3}>
          <NativeSelect
            label="Algorithm"
            data={algoOptions}
            value={algorithm}
            onChange={v => setAlgorithm((v.currentTarget.value as Algo) || "SHA-256")}
          />
        </Grid.Col>
        <Grid.Col span={7}>
          <PasswordInput
            label="Secret key"
            placeholder="Enter key"
            value={key}
            onChange={e => setKey(e.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <NativeSelect
            label="Output"
            data={[
              { value: "hex", label: "Hex" },
              { value: "base64", label: "Base64" },
            ]}
            value={output}
            onChange={v => setOutput((v.currentTarget.value as any) || "hex")}
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={6}>
          <Stack>
            <Textarea
              autosize
              minRows={10}
              value={message}
              onChange={e => setMessage(e.currentTarget.value)}
              placeholder="Type message to sign..."
            />
          </Stack>
        </Grid.Col>
        <Grid.Col span={6}>
          <Stack gap={8}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Signature
              </Text>
              <CopyButton
                value={result}
                size="xs"
                variant="subtle"
                label="Copy"
                fullWidth={false}
              />
            </Group>
            <Textarea autosize minRows={8} readOnly value={result} />
          </Stack>
        </Grid.Col>
      </Grid>
      <Button loading={loading} onClick={run} variant="light">
        Generate
      </Button>
    </Stack>
  );
}
