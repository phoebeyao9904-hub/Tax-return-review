import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType:"custom", configFile:false, root, resolve:{ alias:{ "@":root } }, server:{ middlewareMode:true, hmr:false } });
after(async()=>vite.close());

class MemoryProvider {
  constructor() { this.rows=new Map(); this.failWrites=false; }
  async getWorkspace(id) { return this.rows.get(id) ?? null; }
  async listWorkspaces() { return [...this.rows.values()]; }
  async saveWorkspace(workspace) { if(this.failWrites) throw new Error("simulated write failure"); this.rows.set(workspace.metadata.workspaceId,structuredClone(workspace)); }
  async createWorkspace(workspace) { if(this.rows.has(workspace.metadata.workspaceId)) throw new Error("duplicate"); await this.saveWorkspace(workspace); }
  async deleteWorkspace(id) { this.rows.delete(id); }
}

test("workspace service isolates entity, year, and jurisdiction records",async()=>{
  const [{WorkspaceRepository},{WorkspaceService}]=await Promise.all([vite.ssrLoadModule("/repositories/workspace-repository.ts"),vite.ssrLoadModule("/services/workspace-service.ts")]);
  const provider=new MemoryProvider(); const service=new WorkspaceService(new WorkspaceRepository(provider));
  const federal=service.createDocument({value:1120},{workspaceId:"ha-2025-fed",entityId:"HA",taxYear:2025,jurisdiction:"Federal",returnType:"Form 1120"});
  const georgia=service.createDocument({value:600},{workspaceId:"ha-2025-ga",entityId:"HA",taxYear:2025,jurisdiction:"Georgia",returnType:"Form 600"});
  const prior=service.createDocument({value:2024},{workspaceId:"ha-2024-fed",entityId:"HA",taxYear:2024,jurisdiction:"Federal",returnType:"Form 1120"});
  await service.createWorkspace(federal); await service.createWorkspace(georgia); await service.createWorkspace(prior);
  assert.equal((await service.getWorkspace("ha-2025-fed")).data.value,1120);
  assert.equal((await service.getWorkspace("ha-2025-ga")).data.value,600);
  assert.equal((await service.getWorkspace("ha-2024-fed")).data.value,2024);
});

test("backup round-trip preserves data and validates schema",async()=>{
  const [{WorkspaceRepository},{WorkspaceService}]=await Promise.all([vite.ssrLoadModule("/repositories/workspace-repository.ts"),vite.ssrLoadModule("/services/workspace-service.ts")]);
  const service=new WorkspaceService(new WorkspaceRepository(new MemoryProvider()));
  const document=service.createDocument({notes:"keep me",completeness:{received:true}},{workspaceId:"backup",entityId:"HA",taxYear:2025,jurisdiction:"Federal",returnType:"Form 1120"});
  const restored=service.importWorkspace(JSON.parse(JSON.stringify(service.exportWorkspace(document))));
  assert.deepEqual(restored.data,document.data);
  assert.throws(()=>service.importWorkspace({schemaVersion:"0.1",workspace:document}),/Unsupported backup schema/);
});

test("migration fills collaboration metadata and write failures are observable",async()=>{
  const [{WorkspaceRepository},{WorkspaceService},{migrateWorkspaceData}]=await Promise.all([vite.ssrLoadModule("/repositories/workspace-repository.ts"),vite.ssrLoadModule("/services/workspace-service.ts"),vite.ssrLoadModule("/services/workspace-migrations.ts")]);
  const migrated=migrateWorkspaceData({schemaVersion:"1.0",appVersion:"v18",metadata:{workspaceId:"migrate",entityId:"HA",taxYear:2025},data:{ok:true}});
  assert.equal(migrated.metadata.createdBy,"local-user"); assert.equal(migrated.metadata.revision,1);
  const provider=new MemoryProvider(); provider.failWrites=true;
  const service=new WorkspaceService(new WorkspaceRepository(provider));
  const document=service.createDocument({value:1},{workspaceId:"fail",entityId:"HA",taxYear:2025});
  await assert.rejects(service.saveWorkspace(document),/simulated write failure/);
});
