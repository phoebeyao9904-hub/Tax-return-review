import type { WorkspaceDocument, WorkspaceStorageProvider } from "@/storage/types";

const DATABASE_NAME = "ha-tax-return-review";
const DATABASE_VERSION = 1;
const WORKSPACE_STORE = "workspaces";

const requestResult = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
});
const transactionDone = (transaction: IDBTransaction) => new Promise<void>((resolve, reject) => {
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
  transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
});

export class IndexedDBStorageProvider<T = unknown> implements WorkspaceStorageProvider<T> {
  private databasePromise: Promise<IDBDatabase> | null = null;

  private openDatabase() {
    if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is not available in this browser."));
    if (this.databasePromise) return this.databasePromise;
    this.databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(WORKSPACE_STORE)) database.createObjectStore(WORKSPACE_STORE);
      };
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
      request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB."));
      request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked by another open tab."));
    });
    void this.databasePromise.catch(() => { this.databasePromise = null; });
    return this.databasePromise;
  }

  private async store(mode: IDBTransactionMode) {
    const database = await this.openDatabase();
    const transaction = database.transaction(WORKSPACE_STORE, mode);
    return { transaction, store: transaction.objectStore(WORKSPACE_STORE) };
  }

  async getWorkspace(id: string) {
    const { store } = await this.store("readonly");
    return (await requestResult(store.get(id)) as WorkspaceDocument<T> | undefined) ?? null;
  }

  async saveWorkspace(workspace: WorkspaceDocument<T>) {
    const { transaction, store } = await this.store("readwrite");
    const completion = transactionDone(transaction);
    await requestResult(store.put(workspace, workspace.metadata.workspaceId));
    await completion;
  }

  async createWorkspace(workspace: WorkspaceDocument<T>) {
    const existing = await this.getWorkspace(workspace.metadata.workspaceId);
    if (existing) throw new Error("A workspace with this ID already exists.");
    await this.saveWorkspace(workspace);
  }

  async deleteWorkspace(id: string) {
    const { transaction, store } = await this.store("readwrite");
    const completion = transactionDone(transaction);
    await requestResult(store.delete(id));
    await completion;
  }

  async listWorkspaces() {
    const { store } = await this.store("readonly");
    const workspaces = await requestResult(store.getAll()) as WorkspaceDocument<T>[];
    return workspaces.sort((a, b) => b.metadata.updatedAt.localeCompare(a.metadata.updatedAt));
  }
}
