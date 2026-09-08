import { WorkspaceRepository } from "@/repositories/workspace-repository";
import { APP_VERSION, WORKSPACE_SCHEMA_VERSION, type WorkspaceBackup, type WorkspaceDocument, type WorkspaceMetadata } from "@/storage/types";
import { migrateWorkspaceData } from "@/services/workspace-migrations";

export class WorkspaceService<T = unknown> {
  constructor(private readonly repository: WorkspaceRepository<T>) {}

  getWorkspace(id: string) { return this.repository.getWorkspace(id); }
  listWorkspaces() { return this.repository.listWorkspaces(); }
  deleteWorkspace(id: string) { return this.repository.deleteWorkspace(id); }

  createDocument(data: T, metadata: Partial<WorkspaceMetadata> & Pick<WorkspaceMetadata, "workspaceId" | "entityId" | "taxYear">): WorkspaceDocument<T> {
    const now = new Date().toISOString();
    return {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      metadata: {
        workspaceId: metadata.workspaceId,
        entityId: metadata.entityId,
        taxYear: metadata.taxYear,
        jurisdiction: metadata.jurisdiction || "Federal + States",
        returnType: metadata.returnType || "Corporate Income Tax Review",
        workspaceName: metadata.workspaceName || `${metadata.entityId} · ${metadata.taxYear}`,
        reviewPeriod: metadata.reviewPeriod || String(metadata.taxYear),
        preparationStatus: metadata.preparationStatus || "not_started",
        reviewStatus: metadata.reviewStatus || "not_started",
        ownerId: metadata.ownerId ?? null,
        organizationId: metadata.organizationId ?? null,
        createdAt: metadata.createdAt || now,
        updatedAt: metadata.updatedAt || now,
        createdBy: metadata.createdBy || "local-user",
        updatedBy: metadata.updatedBy || "local-user",
        version: metadata.version || 1,
        revision: metadata.revision || 1,
      },
      data,
    };
  }

  async saveWorkspace(workspace: WorkspaceDocument<T>) {
    const now = new Date().toISOString();
    const next = { ...workspace, appVersion: APP_VERSION, metadata: { ...workspace.metadata, updatedAt: now, updatedBy: "local-user", revision: workspace.metadata.revision + 1 } };
    await this.repository.saveWorkspace(next);
    return next;
  }

  createWorkspace(workspace: WorkspaceDocument<T>) { return this.repository.createWorkspace(workspace); }

  exportWorkspace(workspace: WorkspaceDocument<T>): WorkspaceBackup<T> {
    return { schemaVersion: WORKSPACE_SCHEMA_VERSION, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), workspace };
  }

  importWorkspace(input: unknown): WorkspaceDocument<T> {
    if (!input || typeof input !== "object") throw new Error("Backup is not valid JSON data.");
    const backup = input as Partial<WorkspaceBackup<T>>;
    if (backup.schemaVersion !== WORKSPACE_SCHEMA_VERSION || !backup.workspace) throw new Error("Unsupported backup schema.");
    return migrateWorkspaceData<T>(backup.workspace);
  }
}
