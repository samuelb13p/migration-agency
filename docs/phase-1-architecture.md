# Migration Agency MVP Architecture

## 1. Proposed Architecture

### Architectural style
- Monorepo with explicit separation between frontend, backend, and shared contracts.
- Backend uses modular service boundaries aligned to business domains rather than UI screens.
- Database design is normalized around roles, permissions, profile subtypes, visa cases, document types, and contracts.
- File storage remains abstracted so the MVP can use local private storage now and move to S3-compatible storage later without redesign.

### Chosen stack
- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Backend: Express + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT access tokens + refresh tokens
- Validation: Zod
- File handling: Multer + private storage abstraction + signed download tokens
- PDF generation: PDFKit on the server
- Testing: Vitest + Supertest
- Local environment: Docker Compose

### High-level modules
- `auth`: registration, login, logout, refresh, session tracking
- `access-control`: roles, permissions, and role-permission assignments
- `users`: users plus customer, agent, and admin profile management
- `visa-types`: visa type catalog
- `document-types`: reusable document definitions and file rules
- `visa-rules`: visa-type-required-document mapping
- `visa-cases`: case lifecycle, assignment, and completeness state
- `uploads`: versioned uploads, review state, and secure retrieval
- `contracts`: templates, generation, delivery, and acceptance status
- `notifications`: in-app notifications and email-ready dispatch abstraction
- `audit`: sensitive action logging

### Security model
- Authorization is enforced at route, service, and ownership levels.
- Users authenticate through JWT and refresh sessions.
- Roles are data-driven through `roles`, `permissions`, and `role_permissions`.
- All uploaded files and generated contracts are private and accessed through signed/protected retrieval.
- File metadata and review history remain audit-friendly and append-only by version.

## 2. Folder Structure

```text
migration-agency-mvp/
  apps/
    api/
      prisma/
        schema.prisma
        seed.ts
        migrations/
      src/
        app.ts
        main.ts
        config/
        common/
        lib/
        modules/
          auth/
          access-control/
          users/
          visa-types/
          document-types/
          visa-rules/
          visa-cases/
          uploads/
          notifications/
          contracts/
          audit/
    web/
      app/
      components/
      lib/
  packages/
    shared/
      src/
        enums.ts
        schemas.ts
        api.ts
```

## 3. PostgreSQL / Prisma Schema

Core entities:
- `Role`
- `Permission`
- `RolePermission`
- `User`
- `CustomerProfile`
- `AgentProfile`
- `AdminProfile`
- `RefreshSession`
- `VisaType`
- `DocumentType`
- `VisaTypeRequiredDocument`
- `VisaCase`
- `UploadedDocument`
- `ContractTemplate`
- `Contract`
- `Notification`
- `AuditLog`

### Relationship summary
- One `Role` has many `User`
- One `Role` has many `Permission` through `RolePermission`
- One `User` has exactly one subtype profile depending on assigned role
- One `CustomerProfile` has many `VisaCase`
- One `AgentProfile` has many assigned `VisaCase`
- One `VisaType` has many `VisaTypeRequiredDocument` rules
- One `DocumentType` can be linked to many `VisaType` rows through `VisaTypeRequiredDocument`
- One `VisaCase` has many `UploadedDocument`
- One `VisaCase` has many `Contract`
- One `ContractTemplate` has many generated `Contract`
- One `User` has many `Notification`

## 4. Main Business Rules

- Role assignment is controlled through the `roles` table, not a hardcoded user enum in the database.
- Customers, agents, and admins each have separate profile tables so fields remain clean and role-specific.
- `document_types` define reusable upload rules such as file extensions and size limits.
- `visa_type_required_documents` drives both checklist generation and completeness evaluation.
- Every upload creates a new `uploaded_documents` row with an incremented `version_number`.
- Upload versions are never silently overwritten.
- Case completeness is based on required `document_types` mapped to the case’s `visa_type`.
- Agents review uploaded document versions directly on the upload record in the MVP model.
- Contracts are generated from stored templates and attached to `visa_cases`.

## 5. REST API Design

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Access Control
- `GET /api/roles`
- `GET /api/permissions`
- `PATCH /api/users/:userId/role`

### Profiles
- `GET /api/customer-profile/me`
- `PUT /api/customer-profile/me`
- `GET /api/agent-profile/me`
- `PUT /api/agent-profile/me`
- `GET /api/admin-profile/me`
- `PUT /api/admin-profile/me`

### Visa Types / Document Types / Rules
- `GET /api/visa-types`
- `POST /api/visa-types`
- `PUT /api/visa-types/:visaTypeId`
- `GET /api/document-types`
- `POST /api/document-types`
- `PUT /api/document-types/:documentTypeId`
- `GET /api/visa-types/:visaTypeId/required-documents`
- `POST /api/visa-types/:visaTypeId/required-documents`

### Visa Cases
- `POST /api/visa-cases`
- `GET /api/visa-cases`
- `GET /api/visa-cases/:visaCaseId`
- `PATCH /api/visa-cases/:visaCaseId`
- `GET /api/visa-cases/:visaCaseId/checklist`

### Uploads
- `POST /api/visa-cases/:visaCaseId/uploads`
- `GET /api/visa-cases/:visaCaseId/uploads`
- `POST /api/uploads/:uploadId/review`
- `GET /api/uploads/:uploadId/download-token`

### Contracts
- `GET /api/contract-templates`
- `POST /api/contract-templates`
- `POST /api/visa-cases/:visaCaseId/contracts`
- `GET /api/visa-cases/:visaCaseId/contracts`
- `GET /api/contracts/:contractId/download-token`

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`

## 6. Validation Rules

- `users.email` is unique.
- Only allowed extensions listed on `document_types.allowed_extensions` may be uploaded.
- File size must not exceed `document_types.max_file_size_mb`.
- Customers can upload only to their own `visa_cases`.
- Agents can review uploads only on assigned cases.
- `visa_type_required_documents` must be unique per `visa_type_id` + `document_type_id`.
- Only one role is assigned per user in the MVP.

## 7. Page Map

### Public
- `/login`
- `/register`

### Customer
- `/dashboard`
- `/profile`
- `/cases/[caseId]`
- `/cases/[caseId]/checklist`
- `/cases/[caseId]/uploads`
- `/notifications`
- `/contracts`

### Agent
- `/agent`
- `/agent/cases/[caseId]`
- `/agent/cases/[caseId]/review`
- `/agent/notifications`

### Admin
- `/admin`
- `/admin/users`
- `/admin/roles`
- `/admin/permissions`
- `/admin/visa-types`
- `/admin/document-types`
- `/admin/visa-rules`
- `/admin/contracts/templates`

## 8. Implementation Plan In Build Order

1. Refactor shared enums, DTOs, and architecture docs to the new domain language.
2. Replace Prisma schema with the normalized roles/profiles/visa-cases/document-types model.
3. Rebuild seed data around `roles`, subtype profiles, `document_types`, and `visa_cases`.
4. Align auth and profile modules to `role_id` plus profile subtype tables.
5. Align visa rule, upload, case completeness, and contract services to the new entity names.
6. Reconnect frontend screens to the renamed backend resources.
