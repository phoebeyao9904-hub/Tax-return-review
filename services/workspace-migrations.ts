import { APP_VERSION, WORKSPACE_SCHEMA_VERSION, type WorkspaceDocument, type WorkspaceMetadata } from "@/storage/types";

export function migrateWorkspaceData<T>(input: unknown): WorkspaceDocument<T> {
  if (!input || typeof input !== "object") throw new Error("Workspace data is not an object.");
  const value = input as Partial<WorkspaceDocument<T>>;
  if (value.schemaVersion !== WORKSPACE_SCHEMA_VERSION) throw new Error(`Unsupported workspace schema: ${String(value.schemaVersion)}`);
  if (!value.metadata?.workspaceId || !value.metadata.entityId || !Number.isFinite(value.metadata.taxYear) || value.data === undefined) throw new Error("Workspace metadata is incomplete.");
  const now = new Date().toISOString();
  const metadata: WorkspaceMetadata = {
    workspaceId: value.metadata.workspaceId,
    entityId: value.metadata.entityId,
    taxYear: value.metadata.taxYear,
    jurisdiction: value.metadata.jurisdiction || "Federal + States",
    returnType: value.metadata.returnType || "Corporate Income Tax Review",
    workspaceName: value.metadata.workspaceName || `${value.metadata.entityId} · ${value.metadata.taxYear}`,
    reviewPeriod: value.metadata.reviewPeriod || String(value.metadata.taxYear),
    preparationStatus: value.metadata.preparationStatus || "not_started",
    reviewStatus: value.metadata.reviewStatus || "not_started",
    ownerId: value.metadata.ownerId ?? null,
    organizationId: value.metadata.organizationId ?? null,
    createdAt: value.metadata.createdAt || now,
    updatedAt: value.metadata.updatedAt || now,
    createdBy: value.metadata.createdBy || "local-user",
    updatedBy: value.metadata.updatedBy || "local-user",
    version: Number(value.metadata.version) || 1,
    revision: Number(value.metadata.revision) || 1,
  };
  return { schemaVersion: WORKSPACE_SCHEMA_VERSION, appVersion: value.appVersion || APP_VERSION, metadata, data: value.data };
}
