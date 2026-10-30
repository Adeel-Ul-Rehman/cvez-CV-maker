# CV Maker Backend

A robust Next.js 14 + Neon PostgreSQL + Cloudinary backend architecture for CV building, management, and real-time document rendering.

---

## Architecture & Layers

- **Layer 1: Project Foundation & Data Model**
  - Next.js 14 with App Router, Neon Serverless Postgres client, and typed environment validation via Zod (`lib/env.ts`).
  - Core database schema with `users`, `otp_codes`, `refresh_tokens`, `templates`, `cvs`, and `cv_versions`.
  - Template definition registry with 3 baseline templates.

- **Layer 2: Authentication & User Management**
  - Cookie-based session management (`cv_access`, `cv_refresh`) with rotating refresh tokens and timing-safe OTP verification.
  - Nodemailer fast-timeout SMTP email integration.
  - Google OAuth 2.0 flow with PKCE state cookie verification.
  - In-memory sliding-window rate limiting.

- **Layer 3: CV CRUD, 5-CV Limit, Version History & Public Sharing**
  - Full CV document CRUD with atomic transactions (`withTransaction` using Neon `Pool`).
  - Strict 5-CV limit per user enforced with row locking (`SELECT cv_count FROM users FOR UPDATE`).
  - Automatic version history snapshotting and pruning (capped at 20 versions per CV).
  - Unauthenticated public sharing with random 10-character URL-safe slugs (`/api/cv/public/[slug]`).

- **Layer 4: Cloudinary Uploads & React CV Renderer Foundation**
  - Cloudinary asset upload management with strict 2 MB size and mime type validation.
  - Avatar uploading with automatic cleanup of previous assets and 60-second user rate limiting.
  - Pure React inline-styled CV document renderer (`CvRenderer`) supporting:
    - **Europass** (Clean single-column with top-right square photo and uppercase accented headers)
    - **Jobhire Chronological** (ATS-safe centered single-column header without images)
    - **Jobhire Creative** (Two-column layout with 32% sidebar, tinted background, circular photo, and underline headers)
  - Preview route (`GET /api/cv/[id]/preview`) generating standalone print-optimized HTML.
  - Manual thumbnail upload utility (`npm run upload-thumbnails`).

- **Layer 5: Export Engine (PDF, DOCX, PNG, JPG)**
  - Direct streaming export endpoints (`POST /api/cv/[id]/export/{pdf,docx,png,jpg}`).
  - Headless Chrome integration via `puppeteer-core` with exact A4 page sizing and full-fidelity background rendering.
  - Native editable Microsoft Word document generation (`.docx`) using structured paragraphs, tables, and borders (no rasterized image wrappers).
  - High-DPI retina screenshot generation (PNG/JPEG) at 2x pixel density.
  - Per-user export rate limiting (10 exports per user per 5-minute sliding window).

- **Layer 6: AI Features (Gemini → Groq → HuggingFace Fallback)**
  - 6 specialized resume optimization endpoints with structured JSON schemas and automatic schema retry.
  - Resilient cascading fallback provider architecture: **Gemini (gemini-2.5-flash)** → **Groq (llama-3.3-70b-versatile)** → **HuggingFace (Mistral-7B-Instruct)**.
  - Sliding-window per-feature rate limiting to conserve free-tier API quotas.
  - Fire-and-forget asynchronous audit logging to `ai_usage_logs`.
  - Zero-leakage privacy guarantee: User account credentials, email, user ID, and role are strictly excluded from AI prompts.

- **Layer 7: Admin Panel API**
  - Administrative control plane with strict role-based access control (`requireAdmin`).
  - System overview analytics (`getOverviewStats`) computing real-time user metrics, CV creations, export event counts, AI provider breakdowns, and version snapshots.
  - User administration (paginated list, inspection, role promotion/demotion with self-demotion & last-admin guards, session invalidation, and cascading deletion).
  - CV management & auditing (metadata lists, full data inspection with mandatory `cv.inspect` audit logging, and atomic deletions).
  - Template catalog lifecycle (listing, creation validated against code registry, Cloudinary thumbnail management, safe deletion preventing removal of active templates, and active state toggling).
  - Event tracing & observability:
    - Paginated and filtered `admin_audit_logs`.
    - Centralized `export_events` logging across PDF, DOCX, PNG, and JPG exports.
    - AI usage telemetry and aggregate performance summaries (`ai_usage_logs`).
  - Strict rate limiting: 60 req/min for GET endpoints, 20 req/min for mutating endpoints (POST, PATCH, DELETE).

> **Note on Future Layers**:
> - End-user web UI & design system will be built in **Layer 8**.

---

## Admin Panel API

> **Important**: Admin access is role-based; only users with `role='admin'` can call these endpoints. The admin panel UI is built in the frontend layer. All unauthenticated requests return HTTP 401; non-admin users return HTTP 403 `FORBIDDEN`. Sensitive credentials (`password_hash`, `google_id`, `refresh_token_hash`) are strictly excluded from all API responses.

### Rate Limiting
- **Read Endpoints (GET)**: 60 requests per minute per admin.
- **Mutating Endpoints (POST, PATCH, DELETE)**: 20 requests per minute per admin.
- Exceeding the rate limit returns HTTP 429 `RATE_LIMITED`.

### Audit Log Behavior
- Every administrative action that creates, updates, or deletes state triggers a fire-and-forget entry into `admin_audit_logs`.
- Inspecting a user's CV (`GET /api/admin/cvs/[id]`) is logged as `cv.inspect` to maintain an audit trail for candidate privacy.
- Sensitive values (passwords, tokens, full CV JSON content) are never recorded into audit log metadata.

### Endpoints Reference

| Endpoint | Method | Rate Limit | Description |
| :--- | :---: | :---: | :--- |
| `/api/admin/overview` | GET | 60 / min | System overview stats (users, CVs, exports, AI usage, versions) + 20 recent audit actions with admin emails. |
| `/api/admin/users` | GET | 60 / min | Paginated user list (`page`, `limit`, `search`, `role`, `verified`). Returns safe user metadata and `lastActivityAt`. |
| `/api/admin/users/[id]` | GET | 60 / min | Detailed user profile, their created CVs, and aggregate counters (`cvCount`, `exportsTotal`, `aiCallsTotal`). |
| `/api/admin/users/[id]` | PATCH | 20 / min | Updates user `role` (`"user"` \| `"admin"`) or `emailVerified`. Enforces self-demotion and last-admin protection. Revokes all active refresh tokens on role changes. |
| `/api/admin/users/[id]` | DELETE | 20 / min | Deletes user with cascade cleanup of CVs and tokens. Cleans up Cloudinary avatar if present. Enforces self-deletion and last-admin protection. |
| `/api/admin/cvs` | GET | 60 / min | Paginated CV metadata (`id`, `userId`, `userEmail`, `title`, `templateKey`, `isPublic`, `updatedAt`, `versionCount`, `exportCount`). `cv.data` is excluded for performance. |
| `/api/admin/cvs/[id]` | GET | 60 / min | Full CV document inspection (`data` + `config`) + owner profile info. Logs `cv.inspect` audit action. |
| `/api/admin/cvs/[id]` | DELETE | 20 / min | Deletes CV and atomically decrements owner's `cv_count` in a database transaction. |
| `/api/admin/templates` | GET | 60 / min | Lists all registered database templates with status, display order, and thumbnail URLs. |
| `/api/admin/templates` | POST | 20 / min | Registers a new template. Validates key uniqueness and verifies component exists in `/templates/registry.ts`. |
| `/api/admin/templates/[id]` | PATCH | 20 / min | Updates template metadata (`name`, `description`, `category`, `isActive`, `displayOrder`, `thumbnailUrl`). Validates Cloudinary thumbnail domain/path. |
| `/api/admin/templates/[id]` | DELETE | 20 / min | Deletes template if not currently used by any CVs (`TEMPLATE_IN_USE` error otherwise). Optionally deletes Cloudinary thumbnail asset. |
| `/api/admin/templates/[id]/toggle` | POST | 20 / min | Toggles `is_active` status between `true` and `false`. |
| `/api/admin/audit-logs` | GET | 60 / min | Paginated audit logs with filtering (`action`, `adminId`, `targetType`, date ranges) joined with admin emails. |
| `/api/admin/exports` | GET | 60 / min | Paginated export event logs (`format`, `userId`, `userEmail`, `cvId`, `cvTitle`, `durationMs`, `success`, `errorCode`). |
| `/api/admin/ai-usage` | GET | 60 / min | Paginated AI usage logs and aggregated metrics (`byFeature`, `byProvider`, `successRate`, `avgDurationMs`). |


---

## AI Features & Endpoints

| Endpoint | Method | Rate Limit | Purpose & Output |
| :--- | :---: | :---: | :--- |
| `/api/ai/template-recommend` | POST | 10 / hr | Analyzes target job description against active catalog; returns top template recommendations with fit scores (0–100) and rationale. |
| `/api/ai/improve-summary` | POST | 15 / hr | Generates 3 tailored professional summaries across styles (`professional`, `concise`, `achievement-focused`, max 500 chars). |
| `/api/ai/improve-bullets` | POST | 20 / hr | Converts raw experience notes into 3–5 high-impact STAR/action-verb bullet points with concise rationales. |
| `/api/ai/improve-skills` | POST | 15 / hr | Suggests 5–10 relevant industry skills aligned with target role, automatically filtering out user's existing skills. |
| `/api/ai/ats-check` | POST | 5 / hr | Audits candidate CV structure, language, and formatting for ATS compatibility; provides overall score (0–100), issue severity, and strengths. |
| `/api/ai/template-search` | POST | 30 / hr | Interprets natural language search queries across template categories, styles, and tags with semantic relevance ranking. |

---

## Provider Fallback Architecture

Requests to AI endpoints execute through a cascading provider waterfall:

```
[Incoming Request]
       │
       ▼
1. Google Gemini (gemini-2.5-flash / gemini-1.5-flash)  [Timeout: 20s]
       │ (fails or times out)
       ▼
2. Groq (llama-3.3-70b-versatile)                       [Timeout: 20s]
       │ (fails or times out)
       ▼
3. HuggingFace Inference (Mistral-7B-Instruct-v0.3)     [Timeout: 25s]
       │ (if all fail or budget exhausted)
       ▼
HTTP 503 AI_PROVIDERS_EXHAUSTED
```

- **Key Rotation & Configuration**: Providers are managed via `.env` (`GEMINI_API_KEY`, `GROQ_API_KEY`, `HUGGINGFACE_API_KEY`). If any provider key is omitted or invalid, the provider is bypassed gracefully without downtime.
- **Total Time Budget**: The entire fallback cascade is capped at a strict 60-second execution window.

---

## Data Privacy & Security

1. **Zero Account Data Exposure**: Prompts sent to external AI providers **never** include user IDs, account emails, passwords, user roles, or avatar URLs.
2. **Strict Scope Minimization**: Each AI endpoint transmits only the specific text fields required for that calculation (e.g. `improve-bullets` only receives the bullet text and job context).
3. **Cross-Tenant Isolation**: Candidate documents cannot be queried or analyzed across user boundaries (validated with 404 responses on owner checks).

---

## Cost Control & Free-Tier Operation

- All default provider configurations utilize generous free-tier endpoints (`gemini-2.5-flash`, `llama-3.3-70b-versatile`, `Mistral-7B-Instruct-v0.3`).
- HuggingFace is completely optional and only engaged when `HUGGINGFACE_API_KEY` is provided.
- In-memory sliding-window rate limiters prevent API quota exhaustion on free accounts.

---

## Export Engine

The export engine generates pixel-accurate PDFs, native editable Word (.docx) documents, and high-DPI image previews directly on demand without storing generated files in object storage:

- **PDF Export (`POST /api/cv/[id]/export/pdf`)**:
  - Leverages Chromium with exact A4 print emulation (`printBackground: true`, `preferCSSPageSize: true`).
  - Matches the browser preview pixel-for-pixel, including sidebar color tints and custom fonts.
- **DOCX Export (`POST /api/cv/[id]/export/docx`)**:
  - Generates structurally editable Microsoft Word files with true native paragraphs, tables, styles, and embedded photos.
  - *Editability Tradeoff*: Word's layout rendering engine differs fundamentally from web browser engines; the DOCX prioritizes clean, native document editability (users can click, edit, add bullets, and reformat without repair warnings in Word, LibreOffice, or Google Docs) rather than absolute pixel parity.
- **Image Export (`POST /api/cv/[id]/export/png`, `POST /api/cv/[id]/export/jpg`)**:
  - Captures full-page screenshots at 2x viewport scale factor (`794px × 1123px` baseline, yielding `1588px × 2246px` high-density retina images).

### Cold-Start Performance Note:
Serverless functions executing Chromium in a cold container require ~3–6 seconds on initial invocation while unpacking the browser binary into memory. Subsequent warm invocations execute in ~1.5 seconds.

---

## Local Development Requirement

For local PDF and image generation, `puppeteer-core` launches your system's installed Google Chrome or Microsoft Edge browser.

The engine automatically scans common default paths:
- **Windows**: `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`, `C:\Program Files\Google\Chrome\Application\chrome.exe`, or Microsoft Edge.
- **macOS**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Linux**: `/usr/bin/google-chrome`, `/usr/bin/chromium-browser`

If Chrome is installed in a non-standard directory, specify the binary path in your `.env` file:
```env
PUPPETEER_EXECUTABLE_PATH="C:\Path\To\chrome.exe"
```

---

## Vercel Deployment

On Vercel, the export engine automatically detects the serverless environment and utilizes `@sparticuz/chromium` to dynamically supply a lightweight Chromium binary.

The deployment configuration is maintained in `vercel.json`:
```json
{
  "functions": {
    "app/api/cv/[id]/export/**/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```
- **`memory: 1024`**: Grants Chromium sufficient heap headroom to load document DOMs and render high-resolution raster screenshots without out-of-memory crashes.
- **`maxDuration: 60`**: Accommodates cold-start container spin-up and multi-page rendering under Vercel Hobby plan thresholds.

---

## Cloudinary Folder Layout

Assets in Cloudinary are restricted to the following designated root folders:

```
cv-maker/
├── avatars/                # User profile avatars (publicId: user-{userId}-{timestamp})
└── template-thumbnails/    # Preview thumbnails for template registry (publicId: template-{templateKey}-{timestamp})
```

---

## Template Thumbnails

The thumbnail upload script is a manual operational utility:

```bash
npm run upload-thumbnails
```

### Manual Upload Process:
1. Place thumbnail preview PNG images in the `/public/template-thumbnails/` directory with filenames matching each template key:
   - `public/template-thumbnails/europass.png`
   - `public/template-thumbnails/jobhire-chronological.png`
   - `public/template-thumbnails/jobhire-creative.png`
2. Run `npm run upload-thumbnails`.
3. The script will:
   - Validate each file.
   - Upload it to `cv-maker/template-thumbnails/` in Cloudinary.
   - Update `templates.thumbnail_url` and `templates.thumbnail_public_id` in Neon Postgres.
   - Delete any previous Cloudinary asset if replacing an existing thumbnail.
4. If a thumbnail image is missing, the script prints a descriptive warning and continues processing remaining templates without failing. If no thumbnails are provided, `thumbnail_url` remains `NULL` and the frontend renders a fallback placeholder.

---

## Available Scripts

- `npm run dev` — Starts Next.js development server.
- `npm run build` — Validates TypeScript and builds production Next.js bundle.
- `npm run migrate` — Applies pending SQL migrations tracked in `schema_migrations`.
- `npm run seed` — Seeds the administrator user and default template records.
- `npm run upload-thumbnails` — Uploads template preview thumbnails to Cloudinary.
