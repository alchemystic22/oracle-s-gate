export type LegacyPrivacyMode =
  | "completion_marker_only"
  | "temporary_entry"
  | "do_not_store_after_refresh";

export type RitualMigrationReceipt = {
  migrationId: string;
  fromVersion: string;
  toVersion: string;
  createdAtUtc: string;
  warnings: string[];
};
