export type DbDialect = 'pg';

export interface DbClientProvider {
  dialect: DbDialect;
  db: unknown;
  schema: unknown;
  transaction: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
}
