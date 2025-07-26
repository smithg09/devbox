import React from "react";

export type KeyAlgorithm = "rsa" | "ed25519";

export type KeySize = 1024 | 2048 | 3072 | 4096;

export type KeyFormat = "openssh" | "pem";

export interface KeyGenerationOptions {
  algorithm: KeyAlgorithm;
  keySize?: KeySize; // Only for RSA
  format: KeyFormat;
  comment?: string;
  passphrase?: string;
}

export interface GeneratedKeyPair {
  privateKey: string;
  publicKey: string;
  fingerprint: {
    md5: string;
    sha256: string;
  };
  algorithm: KeyAlgorithm;
  keySize?: KeySize;
  format: KeyFormat;
  comment?: string;
}

export interface KeyInfo {
  type: KeyAlgorithm;
  keySize?: KeySize;
  fingerprint: {
    md5: string;
    sha256: string;
  };
  comment?: string;
  format: KeyFormat;
  isValid: boolean;
  errorMessage?: string;
}

export interface TabConfig {
  value: string;
  label: string;
  icon: React.ReactNode;
}
