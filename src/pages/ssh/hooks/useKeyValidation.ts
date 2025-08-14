import { useState, useCallback } from "react";
import { KeyInfo } from "../types/ssh";
import { validateSSHKey } from "../utils/crypto";

export function useKeyValidation() {
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateKey = useCallback(async (keyData: string) => {
    if (!keyData.trim()) {
      setKeyInfo(null);
      return;
    }

    setIsValidating(true);

    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));

      const info = validateSSHKey(keyData);
      setKeyInfo(info);
    } catch (error) {
      setKeyInfo({
        type: "rsa",
        fingerprint: { md5: "", sha256: "" },
        format: "openssh",
        isValid: false,
        errorMessage: error instanceof Error ? error.message : "Validation failed",
      });
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setKeyInfo(null);
  }, []);

  return {
    keyInfo,
    isValidating,
    validateKey,
    clearValidation,
  };
}
