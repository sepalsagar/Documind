# DocuMind — Semantic Document Intelligence

DocuMind is a secure document intelligence application for PDFs. It ingests uploaded
documents, extracts their text, splits the text into page-aware chunks, generates dense
semantic vector embeddings, and stores everything in MongoDB. Users can then search their
own document library and ask natural-language questions, receiving answers that are grounded
in the retrieved evidence and annotated with page-level source references.

The application is server-rendered with the Next.js App Router, authenticates users with
HttpOnly cookie sessions, and scopes every document, chunk, and retrieval query to the
signed-in owner.

---

## 1. Overview

DocuMind turns a static PDF into a searchable, queryable knowledge source:

- **Secure document management** — every document record and chunk is owned by a user and
  every read/write is filtered by the authenticated user id.
- **PDF ingestion** — uploads are validated (PDF only, non-empty, ≤ 10 MB) and parsed
  server-side.
- **Text extraction** — text is extracted per page so page boundaries are preserved.
- **Document chunking** — page text is normalized and split into overlapping, page-aware
  chunks.
- **Semantic search / retrieval** — each chunk is embedded into a dense vector; a query is
  embedded the same way and ranked against the document's chunks using cosine similarity.
- **Evidence-backed document Q&A** — only the retrieved excerpts are supplied to the answer
  step, and the response cites the supporting chunks.
- **Source / page references** — citations returned to the client carry the chunk id and the
  page range the evidence came from.

---

## 2. Features

| Area | Capability |
| --- | --- |
| Authentication | Email + password accounts, bcrypt password hashing, signed JWT session in an HttpOnly cookie, server-side session lookup, logout |
| Document management | Upload, list, open, rename, and delete documents; per-user chunk counts |
| PDF pipeline | Real PDF text extraction with page awareness, overlapping chunking, batch embedding generation |
| Retrieval | Query embedding, cosine similarity ranking, configurable `topK`, minimum similarity threshold |
| Grounded answers | Responses constrained to retrieved excerpts, citation validation, explicit "not enough evidence" answer |
| Chunk browsing | Inspect stored chunks per document **without** exposing embedding vectors |
| Ownership enforcement | All document, chunk, and RAG queries are scoped by `userId` |
| UI | Responsive dashboard, workspace, and settings screens built on the existing Stitch design system |

---

## 3. How It Works

```
PDF Upload
   ↓
Text Extraction
   ↓
Page-aware Chunking
   ↓
Semantic Embeddings
   ↓
MongoDB Storage
   ↓
Query Embedding
   ↓
Cosine Similarity Retrieval
   ↓
Relevant Evidence
   ↓
Grounded Response + Sources
```

1. **PDF upload** — `POST /api/documents` accepts a `multipart/form-data` upload. The file is
   rejected unless it is a non-empty PDF no larger than 10 MB.
2. **Text extraction** — the PDF buffer is parsed page by page, and the text items of each
   page are concatenated. Pages without extractable text produce an explicit ingestion error.
3. **Page-aware chunking** — each page's text is whitespace-normalized and split into chunks
   of up to 1200 characters with a 200-character overlap, so a chunk never spans pages and
   page numbers remain accurate.
4. **Semantic embeddings** — every chunk is embedded into a dense float vector. Embeddings
   are generated with bounded concurrency so ingestion stays within provider rate limits.
5. **MongoDB storage** — chunks (with their vectors) and the document metadata are persisted,
   each tied to the owning `userId`.
6. **Query embedding** — when a question is asked, the query string is embedded with the same
   model used at ingestion time.
7. **Cosine similarity retrieval** — the query vector is compared against the document's chunk
   vectors using cosine similarity.
8. **Relevant evidence** — chunks below the similarity threshold are discarded, the remainder
   are sorted by similarity, and only the best `topK` (default 5, maximum 8) are kept.
9. **Grounded response + sources** — the selected excerpts are supplied as the authoritative
   context for the answer step. Returned citations are validated against the actual evidence
   ids, and unsupported citation markers are stripped before the response reaches the client.

---

## 4. Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router, Route Handlers, Server Actions-less API routes) |
| Language | TypeScript 5.9 (strict mode) |
| UI | React 19, Tailwind CSS 4, `motion`, `lucide-react`, `class-variance-authority` |
| Database | MongoDB with Mongoose 9 (cached global connection pool) |
| Auth | `jsonwebtoken` (HS256 JWT) + `bcryptjs` password hashing |
| Document processing | `pdf-parse` for page-level text extraction |
| Embeddings / generation | Server-side calls to a managed embedding + text generation API (keyed by `GEMINI_API_KEY`) |
| Testing | Vitest |
| Linting | ESLint with `eslint-config-next` |
| Hosting | Vercel (serverless) with MongoDB Atlas |

---

## 5. Architecture

DocuMind is a single Next.js application. The browser renders React screens and talks to
route handlers; all privileged work (hashing, JWT signing, database access, embeddings)
happens on the server.

```
┌───────────────────────────────────────────────────────────────┐
│ Browser (React 19 client components)                          │
│   Login / Register · Dashboard · Workspace · Settings         │
└───────────────────────────┬───────────────────────────────────┘
                            │ fetch (same-origin, HttpOnly cookie)
┌───────────────────────────▼───────────────────────────────────┐
│ Next.js Route Handlers (Node.js runtime)                      │
│   /api/auth/*      session issue / verify / clear             │
│   /api/documents*  ownership-scoped CRUD + chunk browsing     │
│   /api/rag         retrieval + grounded answer                │
├───────────────────────────────────────────────────────────────┤
│ Library layer                                                 │
│   lib/auth.ts        JWT + cookie configuration               │
│   lib/db.ts          cached Mongoose connection               │
│   lib/ingestion.ts   PDF → page text → chunks → embeddings    │
│   lib/embeddings.ts  embedding provider client                │
│   lib/rag.ts         cosine similarity + ranking + citations  │
│   lib/validation.ts  request payload validation               │
│   lib/api-errors.ts  safe server-error mapping                │
├───────────────────────────────────────────────────────────────┤
│ Data layer (Mongoose models)                                  │
│   User · Document · DocumentChunk                             │
└───────────────────────────┬───────────────────────────────────┘
                            │
                  ┌─────────▼─────────┐        ┌────────────────────┐
                  │  MongoDB Atlas    │        │  Embedding /       │
                  │  users, documents │        │  generation API    │
                  │  and chunks       │        │  (server-side only)│
                  └───────────────────┘        └────────────────────┘
```

**Request flow for a question**

1. The browser sends `POST /api/rag` with the document id and the question.
2. The route handler resolves the session from the HttpOnly cookie, then loads the document
   with `{ _id, userId }` to confirm ownership.
3. `retrieveRelevantChunks` embeds the query and loads only that user's chunks for that
   document, then ranks them by cosine similarity.
4. If nothing clears the similarity threshold the API returns an explicit "not enough
   information" answer with no sources.
5. Otherwise the excerpts are supplied as the only context for the answer step, citations are
   validated, and the answer plus sources are returned.

---

## 6. Project Structure

```
documind/
├── app/
│   ├── layout.tsx                     # Root layout, fonts, metadata
│   ├── page.tsx                       # Client shell: auth gate + screen routing
│   ├── globals.css                    # Tailwind entry point
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts      # Create account + issue session cookie
│       │   ├── login/route.ts         # Verify credentials + issue session cookie
│       │   ├── logout/route.ts        # Clear session cookie
│       │   └── me/route.ts            # Resolve the current session user
│       ├── documents/
│       │   ├── route.ts               # List (GET) and upload/ingest (POST)
│       │   └── [id]/
│       │       ├── route.ts           # Get / rename / delete a document
│       │       └── chunks/route.ts    # List a document's chunks (no vectors)
│       └── rag/route.ts               # Semantic retrieval + grounded answer
├── components/
│   ├── Header.tsx, Sidebar.tsx         # Application shell
│   ├── modals/                         # Upload, rename, delete dialogs
│   └── screens/                        # Login, Dashboard, Workspace, Settings
├── hooks/use-mobile.ts                 # Responsive helper
├── lib/
│   ├── api-errors.ts                   # Maps server failures to safe responses
│   ├── auth.ts                         # Cookie + JWT helpers
│   ├── db.ts                           # Cached MongoDB connection
│   ├── embeddings.ts                   # Embedding provider client
│   ├── ingestion.ts                    # PDF extraction, chunking, embedding
│   ├── rag.ts                          # Similarity, ranking, citations
│   ├── rag.test.ts                     # Unit tests for retrieval helpers
│   ├── mock-data.ts, types.ts, utils.ts
│   └── validation.ts
├── models/
│   ├── User.ts
│   ├── Document.ts
│   └── DocumentChunk.ts
├── .env.example                        # Required environment variables
├── next.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## 7. Authentication & Security

**Session model**

- Passwords are hashed with `bcryptjs` (cost factor 12), and the hash field is `select: false`
  in the schema so it is never returned by default queries.
- On successful register/login the server signs an HS256 JWT (`{ id, email }`, 7-day expiry)
  and sets it in a cookie. Authentication is entirely server-side — the token is never stored
  in `localStorage` or any other client-readable storage.
- Session cookie configuration:

  | Option | Value |
  | --- | --- |
  | `httpOnly` | `true` |
  | `sameSite` | `'lax'` |
  | `secure` | `process.env.NODE_ENV === 'production'` |
  | `path` | `'/'` |
  | `maxAge` | 7 days |

- `/api/auth/me` verifies the cookie, loads the user, and returns only `id`, `name`, and
  `email`. Logout clears the cookie by setting `maxAge: 0`.
- The auth route handlers pin `runtime = 'nodejs'` and `dynamic = 'force-dynamic'` so they
  always execute on the Node.js runtime and are never served from a cache.

**Authorization and data isolation**

- Every document read, rename, delete, chunk query, and RAG query is filtered by the session
  user id, so a user can only ever see and query their own data.
- Deleting a document also deletes its chunks, scoped by both `documentId` and `userId`.
- The chunks endpoint explicitly projects only `pageNumber`, `pageEnd`, `chunkIndex`, `text`,
  `wordCount`, and `createdAt` — embedding vectors are never returned to the client.

**Deployment safety**

- All secrets are read from environment variables at runtime; nothing is hardcoded.
- `.env.local` is git-ignored (`.env*` with an `!.env.example` exception), so only the empty
  placeholder file is committed.
- API error responses never include connection strings, API keys, or stack traces. When the
  server is misconfigured, the API returns a specific configuration message instead of leaking
  internals or failing with an opaque error.

---

## 8. Data Model

**User**

| Field | Type | Notes |
| --- | --- | --- |
| `name` | String | required, trimmed, 2–80 characters |
| `email` | String | required, unique, lowercased, indexed |
| `passwordHash` | String | required, bcrypt hash, excluded from queries by default |
| `createdAt` / `updatedAt` | Date | automatic timestamps |

**Document**

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | ObjectId | ref `User`, required, indexed — ownership key |
| `title` | String | required, ≤ 255 characters |
| `originalFileName` | String | required, ≤ 255 characters |
| `mimeType` | String | defaults to `application/pdf` |
| `fileSize` | Number | bytes, ≥ 0 |
| `status` | String | enum: `uploaded` \| `processing` \| `ready` \| `failed` |
| `pageCount` | Number | number of pages with extracted text |
| `createdAt` / `updatedAt` | Date | automatic timestamps |

Compound index: `{ userId: 1, createdAt: -1 }` for fast per-user listings.

**DocumentChunk**

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | ObjectId | ref `User`, required, indexed |
| `documentId` | ObjectId | ref `Document`, required, indexed |
| `pageNumber` / `pageEnd` | Number | page range the chunk came from |
| `chunkIndex` | Number | 0-based order within the document |
| `text` | String | required chunk text |
| `wordCount` | Number | word count of the chunk |
| `embedding` | [Number] | dense vector, `select: false` so it is never fetched implicitly |
| `createdAt` / `updatedAt` | Date | automatic timestamps |

Unique compound index: `{ userId: 1, documentId: 1, chunkIndex: 1 }`.

---

## 9. Local Development

**Prerequisites**

- Node.js 18.18 or newer (Node 20 LTS recommended)
- npm
- A MongoDB database (MongoDB Atlas or a local `mongod`)

**Steps**

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file from the template
cp .env.example .env.local      # Windows: copy .env.example .env.local

# 3. Fill in MONGODB_URI, JWT_SECRET and GEMINI_API_KEY inside .env.local

# 4. Start the development server
npm run dev
```

The app is then available at `http://localhost:3000`. Create an account on the login screen to
get started, then upload a PDF from the dashboard.

**Available scripts**

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | `next dev` | Start the local development server |
| `npm run build` | `next build` | Production build |
| `npm start` | `next start` | Serve the production build locally |
| `npm run lint` | `eslint .` | Static analysis |
| `npm test` | `vitest run` | Run the unit test suite |

---

## 10. Environment Variables

DocuMind requires exactly three environment variables. All three are server-side only and none
of them are exposed to the browser.

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string used for users, documents, and chunks. |
| `JWT_SECRET` | Yes | Secret used to sign and verify session cookies. Use a long, random value. |
| `GEMINI_API_KEY` | Yes | Server-side API key used by the embedding / generation pipeline for ingestion and grounded answers. |

`.env.example` contains the empty template:

```
MONGODB_URI=
JWT_SECRET=
GEMINI_API_KEY=
```

Never commit real values. `.env.local` is git-ignored, and only the empty `.env.example` is
tracked. When a required variable is missing, the server returns a specific configuration
error instead of a generic failure, which makes deployment problems easy to diagnose.

---

## 11. API Overview

All routes are implemented as Next.js App Router route handlers. Routes marked "cookie" require
a valid session cookie and only ever operate on the signed-in user's data.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | — | Create an account and set the session cookie. |
| `POST` | `/api/auth/login` | — | Verify credentials and set the session cookie. |
| `POST` | `/api/auth/logout` | — | Clear the session cookie. |
| `GET` | `/api/auth/me` | cookie | Return the current session user (`id`, `name`, `email`). |
| `GET` | `/api/documents` | cookie | List the user's documents with per-document chunk counts. |
| `POST` | `/api/documents` | cookie | Upload and ingest a PDF (`multipart/form-data`, ≤ 10 MB). |
| `GET` | `/api/documents/:id` | cookie | Return a single document's metadata. |
| `PATCH` | `/api/documents/:id` | cookie | Rename a document (title ≤ 255 characters). |
| `DELETE` | `/api/documents/:id` | cookie | Delete a document and all of its chunks. |
| `GET` | `/api/documents/:id/chunks` | cookie | List a document's chunks, ordered by index, excluding embeddings. |
| `POST` | `/api/rag` | cookie | Embed the query, retrieve relevant chunks, and return a grounded answer with sources. |

Selected status codes:

- `401` — missing/invalid session.
- `404` — the document does not exist **or** is not owned by the caller.
- `422` — validation failure (bad email/password, invalid query length, non-PDF upload).
- `503` — the server is misconfigured or cannot reach the database (a clear configuration
  message is returned; no secrets are included).

---

## 12. Testing

Unit tests live alongside the retrieval logic in `lib/rag.test.ts` and run with Vitest:

```bash
npm test
```

The suite covers the retrieval primitives that the RAG endpoint depends on:

- `cosineSimilarity` — correct similarity for identical, orthogonal, and mismatched vectors,
  plus invalid-input handling.
- `clampTopK` — bounds the number of retrieved chunks between 1 and the maximum.
- `buildChunkOwnershipFilter` — ensures retrieval is always scoped to a user and document.
- `rankRelevantChunks` — filters out low-similarity chunks and returns them in descending
  similarity order.
- `validateCitations` — strips citation markers that do not correspond to real evidence.

`npm run lint` provides static analysis, and `npm run build` performs a full type check and
production compile.

---

## 13. Deployment

DocuMind is designed to run on Vercel with MongoDB Atlas.

Live Demo:
https://documind-zeta-fawn.vercel.app/

**Steps**

1. Push the repository to GitHub and import it into Vercel (the Next.js preset is detected
   automatically).
2. Add the environment variables in **Project → Settings → Environment Variables** for the
   Production, Preview, and Development environments:

   | Variable | Value |
   | --- | --- |
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | A long random secret |
   | `GEMINI_API_KEY` | Your server-side embedding / generation API key |

3. In MongoDB Atlas, allow the deployment to connect. Serverless platforms use dynamic egress
   IPs, so add `0.0.0.0/0` to **Network Access** (or configure a private/VPC endpoint if your
   plan supports it). Without this, the database connection times out and authentication and
   ingestion will fail.
4. Deploy. The build runs `next build`; the app is served from Vercel's edge network while the
   route handlers run on the Node.js runtime.

**Deployment notes**

- The session cookie is automatically marked `secure` in production, so the site must be served
  over HTTPS (Vercel provides this by default).
- If authentication or ingestion fails after deploying, check the function logs first: a missing
  or incorrect `MONGODB_URI`, `JWT_SECRET`, or Atlas network rule returns a specific
  configuration error message.
- Set `MONGODB_URI` to the same database for Preview deployments if you want previews to share
  data; otherwise use a separate database.

---

## 14. Known Limitations

- **Synchronous ingestion.** Uploads are parsed and embedded inside the request, so very large
  PDFs can take a while or approach serverless execution time limits. There is no background
  job queue yet.
- **In-application vector ranking.** Retrieval loads the document's chunks and ranks them with
  cosine similarity in application code rather than using a MongoDB Atlas Vector Search index,
  which is simpler and exact but does not scale to very large corpora.
- **PDF text dependency.** The pipeline needs a real text layer. Scanned or image-only PDFs
  without OCR produce no extractable text and are rejected.
- **Fixed chunking parameters.** Chunk size (1200 characters) and overlap (200 characters) are
  constants rather than configurable settings.
- **Upload size limit.** A single PDF is limited to 10 MB.
- **Single embedding model.** One embedding model is configured per deployment; changing it
  requires re-ingesting existing documents.
- **Account management scope.** There is no password reset, email verification, multi-factor
  authentication, or rate limiting.
- **Answer quality is bounded, not guaranteed.** Answers are restricted to the retrieved
  excerpts, and citation markers that do not match real evidence are stripped, but the answer
  step can still misread or over-generalize the supplied evidence. Retrieval can also miss
  relevant content if it falls below the similarity threshold.

---

## 15. Future Improvements

- Move ingestion into a background queue (e.g. a worker or serverless queue) with per-document
  processing status.
- Adopt a MongoDB Atlas Vector Search index for large-corpus retrieval.
- Add OCR (e.g. for scanned PDFs) as a fallback when no text layer is present.
- Stream answers to the client as they are generated.
- Make chunk size, overlap, `topK`, and the similarity threshold configurable per workspace.
- Add password reset, email verification, rate limiting, and per-user usage quotas.
- Add integration tests for the API routes (auth, ownership boundaries, ingestion) alongside
  the existing retrieval unit tests.
- Support multi-document retrieval and document sharing/collaboration.

---

## 16. License

This project is provided for portfolio and demonstration purposes. No open-source license file
is currently included in the repository — add a `LICENSE` file before redistributing or reusing
this code.
