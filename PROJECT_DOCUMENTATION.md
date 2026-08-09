# 📚 Student Knowledge AI — Complete Project Flow & Architecture

> A full-stack AI-powered study assistant where students upload PDF lecture notes and chat with them using RAG (Retrieval-Augmented Generation), featuring multilingual auto-detection, university exam marks formatting (2, 5, 10, 15 marks), full-screen diagram lightboxes, interactive PDF page viewers, and non-repeating practice revision hubs.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Tech Stack — Explained in Detail](#2-tech-stack--explained-in-detail)
3. [Backend — File-by-File Breakdown](#3-backend--file-by-file-breakdown)
4. [Frontend — File-by-File Breakdown](#4-frontend--file-by-file-breakdown)
5. [API Endpoints — What Each Does](#5-api-endpoints--what-each-does)
6. [Function Reference — What Each Function Does](#6-function-reference--what-each-function-does)
7. [RAG Pipeline — Deep Dive](#7-rag-pipeline--deep-dive)
8. [Database Models & Relationships](#8-database-models--relationships)
9. [End-to-End User Flow](#9-end-to-end-user-flow)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STUDENT'S BROWSER                          │
│  React 18 + TypeScript + Vite (port 5173 dev / 80 prod via Nginx)   │
│  Apple Design System (#ffffff canvas, #f5f5f7 cards, #0066cc action)│
│  Pages: Landing, Login, Register, Dashboard, Notes, Quizzes, Chat   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP / REST API (Axios + TanStack Query)
                            │ Bearer JWT in Authorization Header
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (port 8000)                      │
│  Routers: /auth  /notes  /chat  /study  /settings  /health          │
│  Core Services: NoteProcessor, RAGPipeline, GroqLLM, Embedding,     │
│                 QdrantClient, RateLimiter, Security, PDFExtractor   │
└────┬────────────────┬──────────────────┬──────────────────┬────────┘
     │                │                  │                  │
     ▼                ▼                  ▼                  ▼
┌─────────┐   ┌──────────────┐   ┌───────────┐   ┌──────────────────┐
│ Storage │   │    Qdrant    │   │  Groq API │   │   Supabase DB    │
│ Adapter │   │ Vector DB    │   │  (LLM)    │   │  PostgreSQL      │
│ (PDFs + │   │ (port 6333)  │   │ Llama-3.3 │   │  (Users, Notes, │
│ Figures)│   │ 384-dim      │   │  70B      │   │  Chat, Quizzes)  │
└─────────┘   └──────────────┘   └───────────┘   └──────────────────┘
```

---

## 2. Tech Stack — Explained in Detail

### 🔵 Frontend

#### React 18 + TypeScript
- **What it is**: A declarative JavaScript UI library for component-driven interfaces paired with static typing.
- **Why used here**: Ensures strict type enforcement across API response payloads (`NoteResponse`, `QueryResponse`, `Citation`). Prevents runtime errors when handling complex chat state and PDF citations.
- **Key use case**: All screens (`Dashboard.tsx`, `Notes.tsx`, `Quizzes.tsx`, `Chat.tsx`) are functional components utilizing hooks (`useState`, `useEffect`, `useRef`, `useMemo`).

#### Vite (`v5.2.11`)
- **What it is**: Next-generation ESM-native frontend build tool and dev server.
- **Why used here**: Instant HMR (Hot Module Replacement) and optimized Rollup production bundling. Dev server runs on port `5173`.
- **Key use case**: `vite.config.ts` manages alias paths and proxies backend requests to `http://localhost:8000`.

#### React Router DOM (`v6.23.1`)
- **What it is**: SPA client-side routing library.
- **Why used here**: Provides seamless client navigation across `/dashboard`, `/notes`, `/quizzes`, `/chat/:id`, `/settings`, `/login`, and `/register` without page reloads.
- **Key use case**: `RouteGuard.tsx` protects private screens—redirecting unauthenticated users to `/login`.

#### TanStack React Query (`v5.45.1`) + Axios
- **What it is**: Asynchronous server-state management and promise-based HTTP client.
- **Why used here**: Manages background re-fetching, cache invalidation, optimistic updates, and JWT bearer token interception in `api.ts`.
- **Key use case**: Custom hooks (`useChat.ts`, `useNotes.ts`, `useStudy.ts`) wrap API calls with React Query caching.

#### TailwindCSS (`v3.4.4`)
- **What it is**: A utility-first CSS styling framework.
- **Why used here**: Rapidly implements the **Apple Light Design System** (`#ffffff` canvas, `#f5f5f7` parchment tiles, `#0066cc` Action Blue, `#1d1d1f` ink text) with responsive layouts and glassmorphism styling.

#### Lucide React (`v0.395.0`)
- **What it is**: Vector icon library for React.
- **Why used here**: Renders sharp icons for search modals, segmented switchers, PDF page viewers, and full-screen image lightboxes (`ZoomIn`, `X`, `BookOpen`, `Sparkles`, `Share2`, `Send`).

---

### 🟢 Backend

#### FastAPI (`v0.111.0`)
- **What it is**: High-performance async ASGI Web Framework built on Starlette and Pydantic.
- **Why used here**: Native `async/await` non-blocking I/O execution, auto-generated Swagger API documentation (`/docs`), and dependency injection (`Depends(get_db)`, `Depends(get_current_user)`).
- **Key use case**: Router endpoints mounted in `main.py` handle auth, notes indexing, chat threads, quizzes, and settings.

#### SQLAlchemy 2.0 Async (`v2.0.31`)
- **What it is**: Python's industry-standard ORM with modern 2.0 async mapping (`Mapped[T]`, `mapped_column()`).
- **Why used here**: Provides non-blocking database queries via `aiosqlite` (local dev) or `asyncpg` (production PostgreSQL) without altering application code.
- **Key use case**: `backend/models/models.py` defines all ORM entities (`User`, `Note`, `DocumentMetadata`, `ChatSession`, `Message`, `Quiz`, `FlashcardDeck`).

#### Alembic (`v1.13.1`)
- **What it is**: Database migration tool for SQLAlchemy.
- **Why used here**: Version-controls database schema alterations safely across environments.
- **Key use case**: `backend/migrations/` stores DDL migration scripts executed via `alembic upgrade head`.

#### Pydantic v2 (`v2.7.4`) + pydantic-settings
- **What it is**: Rust-accelerated data validation library and environment settings loader.
- **Why used here**: Executes 5-20x faster DTO validation and parses `.env` parameters cleanly into `backend/core/config.py`.

#### PyJWT + Passlib (`bcrypt`)
- **What it is**: Password hashing and JSON Web Token encoder/decoder.
- **Why used here**: Implements secure bcrypt salted password hashing and dual JWT access/refresh token rotation.

---

### 🔴 RAG / AI Stack

#### Qdrant Vector Database (`v1.9.1`)
- **What it is**: Ultra-fast vector similarity search engine written in Rust.
- **Why used here**: Stores 384-dimensional dense vectors with payload metadata filtering by `user_id` and `note_id` for multi-tenant data isolation.
- **Collection Name**: `student_notes`
- **Distance Metric**: **Cosine Similarity**

#### SentenceTransformers (`sentence-transformers/all-MiniLM-L6-v2`)
- **What it is**: Dense vector embedding model converting academic text into semantic vectors.
- **Why used here**: Produces 384-dimensional embeddings locally on CPU in under 15ms with 0 API costs.
- **Key use case**: Used by `EmbeddingService` in `backend/services/embeddings/client.py` to embed text chunks and incoming student questions.

#### Groq API (`llama-3.3-70b-versatile`)
- **What it is**: High-speed LPU inference engine running Meta's Llama 3.3 70B model.
- **Why used here**: Delivers 500+ tokens/sec ultra-low latency inference, generating zero-temperature (`0.0`) deterministic academic answers with page-level citations.

#### PyPDF (`v4.2.0`), PyTesseract OCR, & Pillow
- **What it is**: PDF text parser, OCR engine, and image processing library.
- **Why used here**: `extractor.py` extracts text and figures from PDF files. Multi-stage Pillow/OCR logic discards publisher watermark logos (*VTUCircle*) and tiny icons (<100x100px or <4KB).

#### RecursiveCharacterTextSplitter (`backend/services/chunking/splitter.py`)
- **What it is**: Structural text chunking algorithm.
- **Why used here**: Splits text into 1000-character blocks with 200-character overlaps using separators `["\n\n", "\n", " ", ""]` to preserve semantic sentence boundaries.

---

## 3. Backend — File-by-File Breakdown

```
backend/
├── api/
│   └── v1/
│       ├── admin.py            # Administrative health status route
│       ├── auth.py             # User register, login, token refresh, & profile routes
│       ├── chat.py             # RAG question execution (/chat/ask) & chat thread CRUD
│       ├── health.py           # Database & Qdrant infrastructure health probes
│       ├── notes.py            # PDF upload, document listing, title patch, & deletion
│       ├── settings.py         # Student preference settings persistence routes
│       ├── study.py            # AI quiz, flashcard deck, & summary generators
│       ├── users.py            # User profile endpoints
│       └── ws.py               # Real-time WebSocket chat streaming endpoint
├── core/
│   ├── config.py               # Pydantic v2 application environment configuration
│   ├── database.py             # Async SQLAlchemy engine & session factory
│   ├── exceptions.py           # Custom API exceptions (NotFound, RateLimit, etc.)
│   ├── logging.py              # Structured JSON logger setup
│   ├── middleware.py           # CORS, request ID, & timing middleware
│   ├── rate_limit.py           # In-memory sliding window rate limiter
│   └── security.py           # Bcrypt password hashing & JWT token handling
├── models/
│   ├── base.py                 # SQLAlchemy Declarative Base with timestamp mixins
│   └── models.py               # Database entities (User, Note, DocumentMetadata, ChatSession, Message, Quiz, Flashcard)
├── repositories/
│   ├── base.py                 # Generic abstract repository interface
│   ├── chat.py                 # Chat sessions & messages database CRUD queries
│   ├── note.py                 # Notes & document metadata database CRUD queries
│   └── user.py                 # User authentication database queries
├── schemas/
│   ├── auth.py                 # Login & register request/response Pydantic DTOs
│   ├── chat.py                 # Chat sessions, questions, answers, & citation DTOs
│   ├── notes.py                # Note upload, list, & metadata response DTOs
│   ├── study.py                # Quiz, flashcard, & summary generation request DTOs
│   └── users.py                # User profile DTOs
├── services/
│   ├── auth.py                 # User authentication business logic
│   ├── chat/
│   │   └── session.py          # Chat session creation, history loading, & message saving
│   ├── chunking/
│   │   ├── schemas.py          # Chunk data structure schema
│   │   └── splitter.py         # Recursive character text splitter (1000 char, 200 overlap)
│   ├── embeddings/
│   │   └── client.py           # Singleton SentenceTransformers embedding client
│   ├── llm.py                  # Groq API client with zero-temperature system prompt rules
│   ├── note_processor.py       # Asynchronous background document indexing pipeline
│   ├── pdf/
│   │   ├── extractor.py        # PyPDF text parser & Pillow/OCR watermark logo filter
│   │   └── storage.py          # Storage service factory & local file adapter
│   ├── rag/
│   │   ├── pipeline.py         # Unified 5-stage RAG execution pipeline & threshold guardrail
│   │   └── prompts.py          # System prompt blueprints & exam marks formatting rules
│   ├── storage.py              # File storage provider adapter interface
│   ├── study.py                # Non-repeating quiz, flashcards, & chapter summary service
│   └── vectordb/
│       └── client.py           # Qdrant client manager for collection setup & search
├── utils/
│   └── text_processing.py      # Text cleaning, normalization, & string helpers
├── alembic.ini                 # Alembic migration environment configuration
├── Dockerfile                  # Production container build specification
├── main.py                     # FastAPI application entry point & router mounting
└── requirements.txt            # Python backend dependencies
```

---

## 4. Frontend — File-by-File Breakdown

```
frontend/src/
├── components/
│   ├── CommandPalette.tsx      # Global ⌘K search bar & quick navigation modal
│   ├── MarkdownRenderer.tsx    # Custom Markdown parser with Table & Lightbox modal support
│   ├── PDFViewerModal.tsx      # Embedded PDF document page viewer modal
│   ├── RouteGuard.tsx          # Client-side authentication route guard
│   └── Toast.tsx               # Toast notification alert manager
├── contexts/
│   ├── AuthContext.tsx         # User authentication state provider & login/logout methods
│   └── SettingsContext.tsx     # Student study preferences context (Language, Style, Citation)
├── hooks/
│   ├── useChat.ts              # Custom React Query hook for chat sessions & RAG query execution
│   ├── useNotes.ts             # Custom React Query hook for note upload, listing, & deletion
│   └── useStudy.ts             # Custom React Query hook for quiz, flashcard, & summary generation
├── layouts/
│   ├── AppLayout.tsx           # Main application shell with Apple frosted glass top header
│   └── SharedChatLayout.tsx    # Shared chat room layout wrapper
├── pages/
│   ├── Chat.tsx                # ChatGPT-style left sidebar chat room with citation drawer
│   ├── Dashboard.tsx           # Main student hub, Daily Audio Briefing, & stats grid
│   ├── Landing.tsx             # Public landing marketing page
│   ├── Login.tsx               # Student sign-in form with error handling
│   ├── NotFound.tsx            # 404 page not found fallback view
│   ├── Notes.tsx               # PDF drag-and-drop dropzone, notes filter, & note cards
│   ├── Quizzes.tsx             # Practice Hub with segmented switcher (Quizzes, Flashcards, Summary)
│   ├── Register.tsx            # New student registration form
│   └── Settings.tsx            # Preference controls for language, explanation style, & citations
├── services/
│   └── api.ts                  # Axios client instance with JWT token interceptors
├── App.tsx                     # Application route definitions & context provider hierarchy
├── index.css                   # Global CSS styles & Apple design system color tokens
└── main.tsx                    # React application entry point
```

---

## 5. API Endpoints — What Each Does

### Auth Routes (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | ❌ No | Registers a new student account with email and password. |
| `POST` | `/api/v1/auth/login` | ❌ No | Authenticates student credentials and returns JWT access & refresh tokens. |
| `POST` | `/api/v1/auth/refresh` | ❌ No | Generates a new access token using a valid refresh token. |
| `GET` | `/api/v1/auth/me` | ✅ Yes | Retrieves profile information for the authenticated student. |

### Notes Routes (`/api/v1/notes`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/notes/upload` | ✅ Yes | Uploads a PDF document and enqueues background RAG indexing. |
| `GET` | `/api/v1/notes` | ✅ Yes | Lists all course notes belonging to the student. |
| `GET` | `/api/v1/notes/{note_id}` | ✅ Yes | Fetches details and processing status for a specific note. |
| `PATCH` | `/api/v1/notes/{note_id}` | ✅ Yes | Renames a note document title. |
| `DELETE` | `/api/v1/notes/{note_id}` | ✅ Yes | Soft-deletes a note and purges its vector embeddings from Qdrant. |

### Chat Routes (`/api/v1/chat`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/chat/sessions` | ✅ Yes | Creates a new chat session thread. |
| `GET` | `/api/v1/chat/sessions` | ✅ Yes | Retrieves all active chat session threads for the student. |
| `PATCH` | `/api/v1/chat/sessions/{id}`| ✅ Yes | Renames an existing chat session thread. |
| `DELETE` | `/api/v1/chat/sessions/{id}`| ✅ Yes | Soft-deletes a chat session thread and its message logs. |
| `GET` | `/api/v1/chat/sessions/{id}/history` | 🔓 Optional | Retrieves complete conversation message history for a thread. |
| `POST` | `/api/v1/chat/ask` | 🔓 Optional | Submits a query to the RAG pipeline; returns grounded answer with citations. |

### Study Routes (`/api/v1/study`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/study/generate-quiz` | ✅ Yes | Generates a non-repeating 5-question multiple-choice quiz from notes. |
| `POST` | `/api/v1/study/generate-flashcards` | ✅ Yes | Generates a non-repeating deck of 5 study flashcards from notes. |
| `POST` | `/api/v1/study/summarize-chapter` | ✅ Yes | Generates a structured executive chapter summary from notes. |

### Settings & Health Routes

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/settings` | ✅ Yes | Fetches student preferences (language, explanation style, citation format). |
| `PATCH` | `/api/v1/settings` | ✅ Yes | Updates and persists student study preferences. |
| `GET` | `/api/v1/health` | ❌ No | System health check returning API status. |
| `GET` | `/api/v1/health/db` | ❌ No | Database connection health probe. |
| `GET` | `/api/v1/health/vectordb` | ❌ No | Qdrant vector database health probe. |

---

## 6. Function Reference — What Each Function Does

### Core Services (`backend/services/`)

| File | Function Signature | Description |
| :--- | :--- | :--- |
| `backend/core/security.py` | `hash_password(password: str) -> str` | Hashes a plain-text password using salted bcrypt encryption. |
| `backend/core/security.py` | `verify_password(plain: str, hashed: str) -> bool` | Verifies a plain-text password against a stored bcrypt hash. |
| `backend/core/security.py` | `create_access_token(data: dict) -> str` | Generates a signed JWT access token expiring in 30 minutes. |
| `backend/services/pdf/extractor.py` | `extract_pages(pdf_bytes: bytes, note_id: str) -> List[dict]` | Extracts raw page text and figure images from PDF binary data. |
| `backend/services/pdf/extractor.py` | `_is_watermark_logo(img, text) -> bool` | Filters out publisher watermark logos (*VTUCircle*) using size, aspect ratio, and OCR text matching. |
| `backend/services/chunking/splitter.py` | `split_page_text(page_text: str, document_id: UUID, page_number: int) -> List[Chunk]` | Chunks text into 1000-character segments with 200-character overlaps using `RecursiveCharacterTextSplitter`. |
| `backend/services/embeddings/client.py` | `embed_texts(texts: List[str]) -> List[List[float]]` | Generates 384-dimensional dense vectors using local `SentenceTransformer`. |
| `backend/services/vectordb/client.py` | `upsert_chunks(user_id, note_id, chunks, embeddings)` | Indexes vector embeddings into Qdrant with payload metadata filtering. |
| `backend/services/vectordb/client.py` | `search_similar(user_id, query_vector, note_ids, top_k=10)` | Executes cosine similarity search in Qdrant restricted to specific student notes. |
| `backend/services/rag/pipeline.py` | `execute(user_id, session_id, query, note_ids, language)` | Orchestrates RAG workflow: embeds query, searches Qdrant, verifies threshold (`0.45`), builds prompt, and calls Groq LLM. |
| `backend/services/llm.py` | `generate_rag_response(prompt, context_chunks, language)` | Submits structured system prompt and context to Groq API (`llama-3.3-70b-versatile`) at `temperature=0.0`. |
| `backend/services/study.py` | `generate_quiz(user_id, note_id, num_questions=5)` | Samples random vector chunks and calls LLM with a seed token to produce non-repeating quizzes. |
| `backend/services/note_processor.py` | `process_note(note_id: UUID)` | Coordinates background PDF processing pipeline from text extraction to vector indexing. |

---

## 7. RAG Pipeline — Deep Dive

> **RAG = Retrieval-Augmented Generation**
> 
> Instead of asking an LLM to answer from broad web training data (which hallucinates), RAG first *retrieves* relevant passages from the student's uploaded notes, then *augments* the LLM prompt with those passages, *generating* an answer grounded strictly in the student's material.

### Phase 1 — Indexing (Triggered on PDF Upload)

```
Student uploads PDF
        │
        ▼
POST /api/v1/notes/upload  ──→  save_file()  ──→  Local Storage / Supabase
        │
        ▼
Note DB record created (status = "processing")
        │
        ▼
BackgroundTasks.add_task(process_note) ← Runs AFTER HTTP response returns 202
        │
        ▼
process_note(note_id)
        │
        ├── extract_pages(pdf_bytes, note_id)
        │       PyPDF: extracts text & images page-by-page
        │       Pillow / OCR: filters out watermark logos (VTUCircle) & icons (<100px)
        │
        ├── prepare_text_for_chunking(pages)
        │       Normalizes whitespace & cleans formatting
        │
        ├── split_page_text(cleaned_text)
        │       RecursiveCharacterTextSplitter: chunk_size=1000, overlap=200
        │       Preserves page_number, document_id, & figure metadata
        │
        ├── SentenceTransformer.embed_texts(all_chunk_texts)
        │       Model: sentence-transformers/all-MiniLM-L6-v2
        │       Output: 384-dimensional dense vectors
        │
        └── vectordb_client.upsert_chunks()
                Qdrant Collection: "student_notes"
                Point Payload: { user_id, note_id, page_number, text, figures }

After Qdrant Indexing:
  ├── DocumentMetadata DB row created (pages, chars, size)
  └── UPDATE notes SET status = "completed"
```

---

### Phase 2 — Retrieval & Generation (On Each Chat Query)

```
Student asks question: "Explain MapReduce for 10 marks"
Selected Language: Auto-Detect / English / Kannada / Hindi / Spanish
        │
        ▼
POST /api/v1/chat/ask
        │
        ▼
rag_pipeline.execute(user_id, session_id, query, note_ids, language)
        │
        ├── SentenceTransformer.embed_texts([query])
        │       Generates 384-dim query vector
        │
        ├── vectordb_client.search_similar(user_id, query_vector, note_ids, top_k=10)
        │       Executes Cosine Similarity Search in Qdrant
        │       Payload Filter: MUST match user_id AND note_ids
        │       Returns: Top 10 candidate chunks with match scores
        │
        ├── Similarity Score Check (SCORE_THRESHOLD = 0.45)
        │       Filter out chunks where score < 0.45
        │
        ├── If NO chunks pass threshold (score < 0.45):
        │       Return Fallback: "I cannot find this information in the uploaded notes."
        │
        └── If valid chunks retrieved:
                │
                ▼
            System Prompt Assembly (backend/services/llm.py):
              - Grounding & Zero Hallucination Rule
              - Answer Formatting Blueprint (Title ➔ Executive Overview ➔ Subsections ➔ Summary Table)
              - University Exam Marks Scheme Rules (2, 5, 10, 15 marks)
              - Single Summary Table at end rule
              - Image Markdown rule (only if requested)
                │
                ▼
            groq_client.chat.completions.create()
              - Model: llama-3.3-70b-versatile
              - Temperature: 0.0 (Deterministic academic generation)
              - Max Tokens: 2500
                │
                ▼
            Return (answer_text, citations_list)
        │
        ▼
Save Messages to DB ➔ Return QueryResponse with clickable citation pills
```

---

### RAG Configuration Constants

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| `QDRANT_COLLECTION_NAME` | `"student_notes"` | Single Qdrant collection; payload isolation via `user_id` |
| `CHUNK_SIZE` | `1000` | Max character length per chunk |
| `CHUNK_OVERLAP` | `200` | Character overlap between adjacent chunks to maintain context |
| `TOP_K` | `10` | Number of top vector chunks retrieved per question |
| `SCORE_THRESHOLD` | `0.45` | Chunks below `0.45` cosine score are discarded to stop hallucination |
| `LLM_MODEL` | `"llama-3.3-70b-versatile"` | Groq LPU LLM model for zero-temperature generation |

---

## 8. Database Models & Relationships

```
users
├── id (UUID, PK), email (Unique), hashed_password, role, is_verified, is_active
│
├── notes (1:N, CASCADE)
│   ├── id (UUID, PK), user_id (FK -> users.id), title, storage_path, status, error_message
│   │
│   └── document_metadata (1:1, CASCADE)
│       └── note_id (FK -> notes.id), total_pages, total_chars, file_size_bytes
│
├── chat_sessions (1:N, CASCADE)
│   ├── id (UUID, PK), user_id (FK -> users.id), title
│   │
│   └── messages (1:N, CASCADE)
│       └── id (UUID, PK), session_id (FK -> chat_sessions.id), role, content, citations (JSON)
│
├── quizzes (1:N, CASCADE)
│   ├── id (UUID, PK), user_id (FK -> users.id), note_id (FK -> notes.id, SET NULL), title, score
│   │
│   └── quiz_questions (1:N, CASCADE)
│       └── id (UUID, PK), quiz_id (FK -> quizzes.id), question_text, options (JSON), correct_option_idx
│
└── flashcard_decks (1:N, CASCADE)
    ├── id (UUID, PK), user_id (FK -> users.id), note_id (FK -> notes.id, SET NULL), title
    │
    └── flashcards (1:N, CASCADE)
        └── id (UUID, PK), deck_id (FK -> flashcard_decks.id), front, back
```

---

## 9. End-to-End User Flow

```
1. SIGN UP & SIGN IN
   Student opens app ➔ Fills Register form
   POST /api/v1/auth/register ➔ Account created in DB
   POST /api/v1/auth/login ➔ Returns JWT access token (stored in localStorage)
   Redirected to /dashboard

2. UPLOAD & INDEX COURSE NOTES
   Student navigates to /notes ➔ Drops PDF onto drag-and-drop zone
   POST /api/v1/notes/upload (multipart/form-data)
     ➔ PDF saved to storage directory
     ➔ Note DB row created (status = "processing")
     ➔ Background RAG Task runs: extracts text, filters watermarks, chunks (1000/200), embeds (384-dim)
     ➔ Upserts vectors to Qdrant collection "student_notes"
     ➔ DocumentMetadata row created ➔ Note status updated to "completed" ✅

3. STUDY CHAT & QUESTION ANSWERING
   Student opens /chat ➔ Click + New Session
   Types: "Explain MapReduce architecture for 10 marks"
   POST /api/v1/chat/ask
     ➔ Question embedded into 384-dim query vector
     ➔ Qdrant searched for top 10 chunks matching user_id & note_ids
     ➔ Scores checked against threshold (0.45)
     ➔ System prompt assembled with Executive Overview + Bullet Subsections + Summary Table blueprint
     ➔ Groq Llama-3 70B generates answer at temperature 0.0
   Chat UI displays: Structured answer with clickable source citations (e.g. Page 14)

4. CLICK-TO-VERIFY PDF PROOF
   Student clicks citation pill ("Page 14")
   PDFViewerModal opens ➔ Embedded PDF renders scrolled directly to Page 14

5. NON-REPEATING PRACTICE REVISION
   Student opens /quizzes ➔ Clicks "Generate Interactive Quiz"
   POST /api/v1/study/generate-quiz
     ➔ Vector chunks randomly sampled with UUID seed tokens
     ➔ Fresh 5-question multiple-choice quiz generated
```

---

## 10. Deployment Architecture

### Development Setup
- **Frontend Server**: `npm run dev` (Vite on `http://localhost:5173`)
- **Backend ASGI Server**: `python -m uvicorn backend.main:app --reload --port 8000`
- **Vector DB**: Qdrant Cloud or Local Docker (`docker run -p 6333:6333 qdrant/qdrant`)
- **Relational DB**: Local SQLite (`student_rag.db`) or PostgreSQL (`5432`)

### Production Deployment Options
For step-by-step instructions on deploying to AWS (EC2 Docker Compose, AWS App Runner, or AWS ECS Fargate + RDS), refer to the detailed guide:
👉 **[docs/AWS_DEPLOYMENT_GUIDE.md](file:///d:/Projects-For-Hustle/Student%20chatbot/docs/AWS_DEPLOYMENT_GUIDE.md)**

### Production Docker Compose (`docker-compose.yml`)
```yaml
services:
  qdrant:    image: qdrant/qdrant:v1.9.1   # Port 6333, volume qdrant_data
  backend:   Dockerfile in ./backend        # Port 8000, Gunicorn + Uvicorn
  frontend:  Dockerfile in ./frontend       # Port 80, Nginx serving static SPA
```

---

## 11. Summary Table

| Component | Technology | Primary Role in System |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript | SPA Client Interface with static type checking |
| **Build Tool** | Vite 5.2 | High-speed ESM development & Rollup production bundler |
| **Styling System** | TailwindCSS 3.4 | Apple Light Design System implementation |
| **API Client** | Axios + TanStack React Query | Server state management, caching, & JWT interceptors |
| **Web Server API** | FastAPI 0.111 + Uvicorn | Asynchronous Python REST API server |
| **ORM & Data Layer** | Async SQLAlchemy 2.0 + Alembic | Database access & schema migration manager |
| **Relational Database** | PostgreSQL / SQLite | User, Note, Chat, & Quiz metadata persistence |
| **Vector Database** | Qdrant Cloud | 384-dimensional dense vector similarity engine |
| **Embedding Model** | `sentence-transformers/all-MiniLM-L6-v2` | Local CPU 384-dim dense vector embedding generator |
| **LLM Provider** | Groq API (`llama-3.3-70b-versatile`) | Zero-temperature deterministic academic LLM generation |
| **PDF Extraction & OCR** | PyPDF + PyTesseract + Pillow | Text parsing & watermark logo filtering engine |
