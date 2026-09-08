export const WORKSPACE_SCHEMA_VERSION = "1.0";
export const APP_VERSION = "v18";

export type WorkspaceMetadata = {
  workspaceId: string;
  entityId: string;
  taxYear: number;
  jurisdiction: string;
  returnType: string;
  workspaceName: string;
  reviewPeriod: string;
  preparationStatus: string;
  reviewStatus: string;
  ownerId: string | null;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  revision: number;
};

export type WorkspaceDocument<T = unknown> = {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  appVersion: string;
  metadata: WorkspaceMetadata;
  data: T;
};

export interface WorkspaceStorageProvider<T = unknown> {
  getWorkspace(id: string): Promise<WorkspaceDocument<T> | null>;
  saveWorkspace(workspace: WorkspaceDocument<T>): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  listWorkspaces(): Promise<WorkspaceDocument<T>[]>;
  createWorkspace(workspace: WorkspaceDocument<T>): Promise<void>;
}

export type WorkspaceBackup<T = unknown> = {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  appVersion: string;
  exportedAt: string;
  workspace: WorkspaceDocument<T>;
};
