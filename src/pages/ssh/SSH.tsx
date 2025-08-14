import {
  Alert,
  Button,
  Group,
  PasswordInput,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Grid,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { BsLightning } from "react-icons/bs";
import { KeyAlgorithm, KeyFormat, KeySize } from "./types/ssh";
import { useKeyGeneration } from "./hooks/useKeyGeneration";
import { KeyDisplay } from "./components/KeyDisplay";

const KEY_SIZES: { value: string; label: string; description: string }[] = [
  { value: "1024", label: "1024 bits", description: "Legacy - Not recommended for new keys" },
  {
    value: "2048",
    label: "2048 bits",
    description: "Standard - Good balance of security and performance",
  },
  { value: "3072", label: "3072 bits", description: "Enhanced - Higher security" },
  { value: "4096", label: "4096 bits", description: "Maximum - Highest security" },
];

const ALGORITHMS: { value: string; label: string; description: string }[] = [
  { value: "rsa", label: "RSA", description: "Widely supported, configurable key sizes" },
  { value: "ed25519", label: "ED25519", description: "Modern, fast, and secure (256-bit)" },
];

const FORMATS: { value: string; label: string; description: string }[] = [
  { value: "openssh", label: "OpenSSH", description: "Standard SSH format" },
  { value: "pem", label: "PEM", description: "Privacy-Enhanced Mail format" },
];

export default function SSH() {
  const [algorithm, setAlgorithm] = useInputState<KeyAlgorithm>("rsa");
  const [keySize, setKeySize] = useInputState<string>("2048");
  const [format, setFormat] = useInputState<KeyFormat>("openssh");
  const [comment, setComment] = useInputState("");
  const [passphrase, setPassphrase] = useInputState("");

  const { isGenerating, generatedKeys, error, generateKeys, clearKeys } = useKeyGeneration();

  const handleGenerate = async () => {
    await generateKeys({
      algorithm,
      keySize: algorithm === "rsa" ? (parseInt(keySize) as KeySize) : undefined,
      format,
      comment: comment.trim() || undefined,
      passphrase: passphrase.trim() || undefined,
    });
  };

  const handleBack = () => {
    clearKeys();
  };

  const getKeySizeWarning = (size: string) => {
    if (size === "1024") {
      return "Warning: 1024-bit keys are considered weak by modern standards";
    }
    if (size === "4096") {
      return "Note: 4096-bit keys provide maximum security but may be slower";
    }
    return null;
  };

  return (
    <ScrollArea
      className="overflow-padding"
      h="100%"
      scrollbars="y"
      type="never"
      overscrollBehavior="none"
    >
      <Stack gap="md" align="left" pb={12}>
        {!generatedKeys ? (
          <>
            <Stack gap="lg">
              <Group gap="sm">
                <Text fw={600}>Generate SSH Keys</Text>
              </Group>

              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="Algorithm"
                    description="Choose the cryptographic algorithm"
                    value={algorithm}
                    onChange={value => setAlgorithm(value as KeyAlgorithm)}
                    data={ALGORITHMS}
                    disabled={isGenerating}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Format"
                    description="Choose the key format"
                    value={format}
                    onChange={value => setFormat(value as KeyFormat)}
                    data={FORMATS}
                    disabled={isGenerating}
                  />
                </Grid.Col>
              </Grid>

              {algorithm === "rsa" && (
                <Select
                  label="Key Size"
                  description="Larger keys are more secure but slower"
                  value={keySize}
                  onChange={value => setKeySize(value || "2048")}
                  data={KEY_SIZES}
                  disabled={isGenerating}
                />
              )}

              {algorithm === "ed25519" && (
                <Alert color="blue" variant="light" radius="md">
                  <Text size="sm">
                    <strong>ED25519 Keys:</strong> Use a fixed 256-bit key size and are considered
                    more secure and faster than RSA.
                  </Text>
                </Alert>
              )}

              {getKeySizeWarning(keySize) && (
                <Alert color={keySize === "1024" ? "red" : "blue"} variant="light" radius="md">
                  <Text size="sm">{getKeySizeWarning(keySize)}</Text>
                </Alert>
              )}

              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Comment (Optional)"
                    description="Add a comment to identify this key"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="user@hostname"
                    disabled={isGenerating}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput
                    label="Passphrase (Optional)"
                    description="Encrypt the private key with a passphrase"
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    placeholder="Leave empty for no passphrase"
                    disabled={isGenerating}
                  />
                </Grid.Col>
              </Grid>
              <Button
                leftSection={<BsLightning />}
                onClick={handleGenerate}
                loading={isGenerating}
                mt={12}
                variant="light"
              >
                Generate Key Pair
              </Button>
            </Stack>

            {error && (
              <Alert color="red" variant="light">
                <Text size="sm">{error}</Text>
              </Alert>
            )}
          </>
        ) : (
          <>
            <KeyDisplay keys={generatedKeys} handleBack={handleBack} />
          </>
        )}
      </Stack>
    </ScrollArea>
  );
}
