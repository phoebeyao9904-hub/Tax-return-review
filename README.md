# HA Tax Return Review

Internal corporate income tax review workspace for independently reviewing federal and state returns, tracing source data, documenting book-to-tax differences, checking federal form completeness, and preparing questions for the tax firm.

## Main review areas

- Federal Form 1120 and supporting schedules
- Federal Form Completeness & Cross-check
- Federal Tax Return Preparation Readiness
- State filing scope, Nexus, apportionment, and configured state returns
- Trial Balance mapping and Book-to-Tax bridge
- Field guidance, data lineage, missing-data follow-up, and questions
- Excel workpapers plus JSON workspace backup and restore

## Data Persistence Architecture

The application uses a replaceable data-access architecture. React UI code calls the workspace service; it does not call IndexedDB directly.

```text
React UI
  -> WorkspaceService
    -> WorkspaceRepository
      -> WorkspaceStorageProvider
        -> IndexedDBStorageProvider (current)
        -> SupabaseStorageProvider (future)
```

Main files:

- `storage/types.ts` — provider contract, workspace envelope, metadata, and backup types
- `storage/indexeddb-storage.ts` — current browser database adapter
- `repositories/workspace-repository.ts` — storage-independent repository
- `services/workspace-service.ts` — create, save, list, delete, export, and import operations
- `services/workspace-migrations.ts` — schema validation, normalization, and future migration entry point
- `app/page.tsx` — hydration, 500 ms debounced auto-save, save status, and workspace UI

LocalStorage is used only for the most recently opened workspace ID and one-time migration of data saved by versions through v17. Complete tax-review data is stored in IndexedDB.

## Workspace Storage

IndexedDB database: `ha-tax-return-review`

Object store: `workspaces`

Each workspace is stored under its opaque `workspaceId`. Entity, year, jurisdiction, and return type are metadata, so separate years, entities, and jurisdictions cannot overwrite one another.

```ts
type WorkspaceDocument = {
  schemaVersion: "1.0";
  appVersion: "v18";
  metadata: {
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
  data: {
    workspace: SavedProject;
    reviewRules: ReviewRule[];
  };
};
```

The payload includes return-line values, calculated inputs, overrides, sources, notes, questions, Trial Balance mapping, Book-to-Tax adjustments, state assessments, completeness results, preparation readiness, and guided-review workpapers.

On startup the app completes this sequence before enabling auto-save:

1. Migrate the legacy LocalStorage payload, if present.
2. Read and validate IndexedDB workspaces.
3. Resume the most recently opened workspace.
4. Hydrate all React review state.
5. Enable debounced auto-save.

This order prevents default React state from overwriting saved data.

## Auto-Save and recovery

- Review changes are marked as unsaved immediately.
- A 500 ms debounce consolidates keyboard input and related state changes.
- The header reports Loading, Unsaved changes, Saving, Saved with time, or Save failed.
- **Save Now** writes the complete active workspace without refreshing the page.
- Failed writes keep the current in-memory state and expose Retry and emergency JSON export actions.
- Workspace-level and review-record revision fields provide a foundation for conflict detection and field audit history.

## Workspace management

The workspace selector supports:

- Create and open workspace
- Rename workspace
- Duplicate into the next tax year without copying current-year tax numbers
- Delete only the selected workspace after confirmation
- Separate Entity, Tax Year, Jurisdiction, Return Type, and Review Period metadata

## Backup & Restore

**Export Backup** downloads the current workspace as JSON with:

- `schemaVersion`
- `appVersion`
- `exportedAt`
- complete workspace metadata and review payload

**Import Backup** validates JSON, schema version, workspace metadata, and required review data before presenting two explicit choices:

- Create as new workspace
- Replace current workspace

Legacy JSON backups from schema versions 2.0 through 9.0 remain importable and are converted to the current workspace envelope.

## Schema migration

Current workspace schema: `1.0`

All reads pass through `migrateWorkspaceData()`. New migrations should be added there before changing `WORKSPACE_SCHEMA_VERSION`. Storage adapters must return a workspace document to the repository; UI components should never implement version conversion.

## Future Supabase Migration

Add a `SupabaseStorageProvider` implementing `WorkspaceStorageProvider`, then inject it into `WorkspaceRepository`. The UI and tax-review logic do not need to change.

Reserved metadata already includes `ownerId`, `organizationId`, `createdBy`, `updatedBy`, `version`, and `revision` for future authentication, Row Level Security, audit history, and multi-user conflict detection. A future provider can use:

- Supabase Auth for email, Microsoft, or Google identity
- PostgreSQL for workspace documents and normalized audit records
- Row Level Security for Entity-based Reviewer, Viewer, and Admin access
- Supabase Storage for return PDFs, Trial Balance files, apportionment files, and workpapers

No Supabase credentials or production account are required by the current release.

## Development

```bash
npm run build
npm run lint
node --test tests/*.test.mjs
```

Node.js `>=22.13.0` is required.
