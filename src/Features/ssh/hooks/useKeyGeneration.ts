import { useCallback, useState } from "react";
import { GeneratedKeyPair, KeyGenerationOptions } from "../types/ssh";
import { generateKeyPair } from "../utils/crypto";

export function useKeyGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeyPair | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateKeys = useCallback(async (options: KeyGenerationOptions) => {
    setIsGenerating(true);
    setError(null);

    try {
      const keyPair = await generateKeyPair(options);
      setGeneratedKeys(keyPair);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate key pair");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearKeys = useCallback(() => {
    setGeneratedKeys(null);
    setError(null);
  }, []);

  return {
    isGenerating,
    generatedKeys,
    error,
    generateKeys,
    clearKeys,
  };
}
