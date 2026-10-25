<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# DocuMind

DocuMind is a private, source-grounded PDF question-answering app. Upload a
text-based PDF, ask questions in plain English, and inspect the retrieved
passages and page numbers behind each answer.

## Features and limitations

- Server-rendered public landing page with canonical metadata, sitemap, robots,
  favicon, and Open Graph image.
- JWT sessions in the existing `documind_token` HttpOnly cookie.
- Per-user document ownership checks for library, document, chunks, upload, and
  chat operations.
- PDF text extraction, page-aware overlapping chunks, embeddings, cosine
  retrieval, and grounded answers with citations.
- MongoDB-backed rate limits with TTL counters when MongoDB is configured.
- Uploads are limited to 10 MB and 100 pages and must contain a PDF header.
- Scanned/image-only PDFs are not OCR'd yet; upload an OCR'd or text-based PDF.
- Gemini is used when `GEMINI_API_KEY` is configured. Local deterministic
  embeddings and a grounded excerpt fallback keep development/test flows
  usable without the API, but are not a substitute for production AI quality.

The app does not currently store uploaded PDF binaries, perform OCR, or provide
multi-user document sharing.

Try the demo creates a temporary workspace with an original Northstar Labs
leave and expense policy sample. Demo users can ask 15 questions per hour;
demo data expires after 24 hours.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`, then set `GEMINI_API_KEY` and a strong server-only `JWT_SECRET` (for example, `openssl rand -base64 48`). Do not commit `.env.local`.
3. Run the app:
   `npm run dev`

4. Run focused unit tests:
   `npm test`
5. Seed the demo template in the configured MongoDB database:
   `npm run seed:demo`

The existing end-to-end QA script is available as `npm run qa` and requires a
configured `JWT_SECRET`.

## Production (standalone)

This project uses Next.js standalone output. After supplying production environment variables, run:

```bash
npm run build
npm run start
```

`npm run start` runs `node .next/standalone/server.js`; `next start` is not compatible with this configuration.
