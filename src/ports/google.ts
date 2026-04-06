export interface GoogleTokenPort {
  getRefreshTokenByUserId: (userId: string) => Promise<string | null>;
  upsertEncryptedRefreshToken: (params: {
    userId: string;
    providerAccountId: string;
    encryptedRefreshToken: string;
  }) => Promise<void>;
}
