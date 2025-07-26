import { useState, useCallback } from "react";
import { KeyGenerationOptions, GeneratedKeyPair } from "../types/ssh";
import { generateKeyPair } from "../utils/crypto";

export function useKeyGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeyPair | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateKeys = useCallback(async (options: KeyGenerationOptions) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log("Generating keys with options:", options);
      const keyPair = await generateKeyPair(options);
      console.log("Key generation successful");
      setGeneratedKeys(keyPair);
    } catch (err) {
      console.error("Key generation failed:", err);
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
