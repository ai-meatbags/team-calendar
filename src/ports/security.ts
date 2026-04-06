export interface TokenVaultPort {
  encrypt: (value: string) => string;
  decrypt: (value: string | null | undefined) => string | null;
  isEncrypted: (value: string | null | undefined) => boolean;
}
