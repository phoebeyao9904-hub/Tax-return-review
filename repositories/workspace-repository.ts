import type { WorkspaceDocument, WorkspaceStorageProvider } from "@/storage/types";
import { migrateWorkspaceData } from "@/services/workspace-migrations";

export class WorkspaceRepository<T = unknown> {
  constructor(private readonly provider: WorkspaceStorageProvider<T>) {}

  async getWorkspace(id: string) {
    const workspace = await this.provider.getWorkspace(id);
    return workspace ? migrateWorkspaceData<T>(workspace) : null;
  }

  async listWorkspaces() {
    return Promise.all((await this.provider.listWorkspaces()).map(workspace => migrateWorkspaceData<T>(workspace)));
  }

  saveWorkspace(workspace: WorkspaceDocument<T>) { return this.provider.saveWorkspace(workspace); }
  createWorkspace(workspace: WorkspaceDocument<T>) { return this.provider.createWorkspace(workspace); }
  deleteWorkspace(id: string) { return this.provider.deleteWorkspace(id); }
}
