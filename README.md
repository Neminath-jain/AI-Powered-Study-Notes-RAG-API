# 🎓 Student Knowledge AI — Grounded RAG Platform for Education

**Student Knowledge AI** is a production-grade, enterprise-ready **Retrieval-Augmented Generation (RAG)** platform designed specifically for university students, educators, and self-learners. 

Unlike generic AI chatbots that hallucinate or provide generic web answers, Student Knowledge AI indexes specific textbook chapters, syllabus PDFs, and lecture slides to generate **100% grounded answers, page-level citations, interactive PDF viewers, figure lightboxes, and university exam-ready answers (2, 5, 10, 15 marks)**.

---

## 🌟 1. The Real-World Problem & Why RAG?

### The Problem with Standard AI Chatbots (ChatGPT, Gemini out-of-the-box)
1. **Hallucinations & False Information**: Out-of-the-box LLMs often invent plausible-sounding equations, false facts, or fake citations that don't exist in a student's actual course syllabus.
2. **Lack of Specific Course Context**: Generic models do not know the specific textbook edition, professor's lecture slides, or chapter definitions required for university exams.
3. **No Page-Level Proof**: Standard chatbots cannot point students to the exact page, paragraph, or diagram in their assigned PDF.

### How Student Knowledge AI Solves It (Grounded RAG)
- **Zero-Hallucination Guardrails**: Answers are constructed **strictly and exclusively** from the retrieved text chunks of uploaded notes. If information is missing, the AI explicitly states it cannot find it.
- **Page-Level Citations & Click-to-Verify PDF Viewer**: Every answer displays interactive citation pills (`Note Title, p. 14`). Clicking opens an embedded PDF viewer scrolled directly to that exact page.
- **University Exam Marks Formatting**: Automatically formats responses based on standard exam schemes (2 Marks short answers, 5 Marks structured breakdowns, 10/15 Marks comprehensive university answers).
- **Automated Figure & Watermark Filtering**: Extracts real textbook diagrams while automatically filtering out publisher watermarks (e.g. *VTUCircle*) and logo banners.
- **AI Practice & Revision Hub**: Generates non-repeating multiple-choice quizzes, interactive flippable flashcards, and executive chapter summaries directly from notes.

---

## 🛠️ 2. Technology Stack & Rationale

| Layer | Technology | Why & How It Is Used |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + TypeScript + Vite** | Provides lightning-fast build speeds, strict type safety, and responsive component rendering. |
| **Design System** | **Apple Light Design System (TailwindCSS)** | Built following Apple design guidelines (`#ffffff` canvas, `#f5f5f7` parchment tiles, `#0066cc` Action Blue, `#1d1d1f` high-contrast ink typography). |
| **State & Async API** | **TanStack React Query + Axios** | Manages server-state caching, background re-fetching, optimistic updates, and JWT token interceptors. |
| **UI Components & Icons** | **Lucide React** | Premium icon set for segmented nav switchers, command palettes, lightboxes, and drawer controls. |
| **Backend API** | **Python 3.12 + FastAPI + Uvicorn** | Asynchronous ASGI Web Framework offering low latency, automatic OpenAPI docs (`/docs`), and native async SQLAlchemy performance. |
| **Database & ORM** | **Async SQLAlchemy 2.0 + Alembic** | Asynchronous ORM managing relational schemas for users, notes, chat sessions, messages, quizzes, and flashcards. |
| **Vector Store** | **Qdrant Vector Database** | Ultra-fast vector database storing 384-dimensional dense embeddings with metadata filtering (by `user_id` and `note_id`). |
| **Embedding Engine** | **SentenceTransformers (`all-MiniLM-L6-v2`)** | Generates 384-dim dense vector representations locally on CPU/GPU with high semantic accuracy for academic text. |
| **LLM Provider** | **Groq API (`llama-3.3-70b-versatile` & `llama-3.1-8b-instant`)** | High-throughput, low-latency LLM inference executing zero-temperature (`0.0`) deterministic academic generation. |
| **PDF & Image Extraction** | **PyPDF + PyTesseract OCR + Pillow** | Extracts text and embedded figures from PDF files. Uses Pillow & OCR filtering to strip watermark logos (`VTUCircle`, banners). |

---

## 📂 3. Repository Directory Structure

```
d:/Projects-For-Hustle/Student chatbot/
├── backend/                        # FastAPI Backend Application
│   ├── api/                        # API Endpoint Routers (v1)
│   │   └── v1/
│   │       ├── admin.py            # System health & admin routes
│   │       ├── auth.py             # User register, login, & JWT token endpoints
│   │       ├── chat.py             # RAG question answering & chat session CRUD
│   │       ├── health.py           # Infrastructure health check endpoints
│   │       ├── notes.py            # PDF upload, document list, rename & delete
│   │       ├── settings.py         # User study settings persistence
│   │       ├── study.py            # Quiz, flashcards, & chapter summary generators
│   │       └── ws.py               # Real-time WebSocket streaming endpoints
│   ├── core/                       # App Configuration & System Core
│   │   ├── config.py               # Pydantic v2 BaseSettings environment loader
│   │   ├── database.py             # Async SQLAlchemy engine & session maker
│   │   ├── exceptions.py           # Custom API exceptions (NotFound, RateLimit, etc.)
│   │   ├── logging.py              # Structured JSON logging configuration
│   │   └── security.py           # Password hashing (bcrypt) & JWT creation
│   ├── models/                     # Relational Database Schemas (SQLAlchemy)
│   │   └── models.py               # User, Note, ChatSession, Message, Quiz, Flashcard models
│   ├── repositories/               # Data Access Layer (Repository Pattern)
│   │   ├── chat.py                 # Chat sessions & messages database operations
│   │   └── note.py                 # Notes & embeddings database CRUD
│   ├── schemas/                    # Pydantic Request/Response DTO Schemas
│   │   ├── auth.py, chat.py, note.py, study.py, user.py
│   ├── services/                   # Business Logic & Core RAG Pipeline
│   │   ├── chunking/               # Text splitter & document chunkers
│   │   ├── embeddings/             # SentenceTransformers vector embedding client
│   │   ├── pdf/                    # PyPDF text extraction & Pillow watermark filter
│   │   ├── rag/                    # Full RAG Pipeline (search -> prompt -> LLM call)
│   │   │   ├── pipeline.py         # 5-step RAG execution & threshold guardrails
│   │   │   └── prompts.py          # System prompts & marks formatting rules
│   │   ├── vectordb/               # Qdrant client connection & vector search
│   │   ├── llm.py                  # Groq API client with Llama-3 model fallback
│   │   ├── note_processor.py       # Asynchronous background document indexing
│   │   └── study.py                # AI Quiz, Flashcards & Summary generation service
│   ├── main.py                     # FastAPI application factory & middleware
│   ├── requirements.txt            # Python dependencies
│   └── alembic.ini                 # Database migration configuration
├── frontend/                       # React + TypeScript + Vite Application
│   ├── src/
│   │   ├── components/             # Reusable UI Components
│   │   │   ├── CommandPalette.tsx  # Global ⌘K search & action modal
│   │   │   ├── MarkdownRenderer.tsx# Custom Markdown parser with Table & Lightbox support
│   │   │   ├── PDFViewerModal.tsx  # Embedded PDF document page viewer
│   │   │   ├── RouteGuard.tsx      # Protected & Public route authentication guards
│   │   │   └── Toast.tsx           # Application notification system
│   │   ├── contexts/               # React Context Providers
│   │   │   ├── AuthContext.tsx     # Student auth state & login/register state
│   │   │   └── SettingsContext.tsx # Persistent student study preferences
│   │   ├── hooks/                  # TanStack React Query Custom Hooks
│   │   │   ├── useChat.ts          # Chat sessions & RAG query execution hooks
│   │   │   ├── useNotes.ts         # Notes upload, rename, & delete hooks
│   │   │   └── useStudy.ts         # Quiz, flashcards, & summary generation hooks
│   │   ├── layouts/                # Application Layout Templates
│   │   │   ├── AppLayout.tsx       # Apple frosted header, segmented nav, & drawer layout
│   │   │   └── SharedChatLayout.tsx# Shared chat layout wrapper
│   │   ├── pages/                  # Page Views
│   │   │   ├── Dashboard.tsx       # Course hub, audio briefing, stats, & recent lists
│   │   │   ├── Notes.tsx           # PDF upload dropzone, filter tabs, & note cards
│   │   │   ├── Quizzes.tsx         # AI Study Hub (Quizzes, Flashcards, Summarizer)
│   │   │   ├── Chat.tsx            # ChatGPT-style left sidebar chat room
│   │   │   ├── Settings.tsx        # Preference controls (Language, Style, Citation)
│   │   │   ├── Landing.tsx         # Public marketing page
│   │   │   ├── Login.tsx           # Authentication sign-in
│   │   │   └── Register.tsx        # New student registration
│   │   ├── App.tsx                 # Application routes & provider wrappers
│   │   ├── main.tsx                # React DOM root entry point
│   │   └── index.css               # Apple design tokens & global CSS styles
│   ├── package.json                # Frontend npm dependencies
│   ├── vite.config.ts              # Vite bundler configuration
│   └── tailwind.config.js          # Tailwind CSS theme extensions
├── storage/                        # Persistent Storage
│   ├── figures/                    # Extracted PDF images & diagrams
│   └── notes/                      # Uploaded PDF document files
├── .env.example                    # Environment variable template
├── .gitignore                      # Git exclusion rules
└── README.md                       # Complete Project Documentation
```

---

## ⚡ 4. Special Platform Features

### 1. Grounded RAG QA & Click-to-Verify Citations
- Performs 384-dimensional dense vector similarity search against Qdrant.
- Returns citations with exact page numbers and similarity match scores.
- Clicking any citation opens the **PDF Viewer Modal** scrolled directly to that page.

### 2. University Exam Marks Formatting Engine
Answers adapt dynamically when a student requests specific exam formats:
- **2 Marks / Short Answer**: Concise 2-3 sentence definition and key facts.
- **5 Marks Answer**: Executive Overview + 4-5 Core Key Points + Brief Conclusion.
- **10 Marks / 15 Marks Answer**: Full university exam paper layout with Title, Executive Overview, Detailed Subsections with bullet points, Advantages & Limitations, and a Summary Table at the bottom.

### 3. Lightbox Image Viewer & Watermark Filter
- Automatically extracts real textbook figures while filtering out publisher watermarks (*VTUCircle*, header lines, tiny bullet icons).
- Clicking any figure in the chat opens a **Full-Screen Lightbox Modal** on a dark backdrop.

### 4. Non-Repeating AI Practice Hub
- Generates interactive multiple-choice quizzes, flippable flashcard decks, and chapter summaries.
- Uses random vector chunk sampling and unique seed tokens to guarantee **fresh, non-repeating questions** on every click.

### 5. ChatGPT-Style Chat History Sidebar
- Left sidebar displaying past study sessions with dates, search filter, inline title editing, and thread deletion.
- Sidebar collapse/expand toggle button for distraction-free reading.

### 6. Audio Course Briefing
- Browser-native speech synthesis player providing a voice summary of indexed course materials.

---

## 🚀 5. Local Setup & Running Guide

### Environment Variables Setup
Copy `.env.example` to create a local `.env` file:
```env
ENVIRONMENT=development
LOG_LEVEL=INFO
PROJECT_NAME="Student Knowledge AI"

JWT_SECRET=supersecretaccesskey_change_me_in_production_1234567890
JWT_REFRESH_SECRET=supersecretrefreshkey_change_me_in_production_1234567890
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

DATABASE_URL=sqlite+aiosqlite:///./student_rag.db
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=student_notes

EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
GROQ_API_KEY=your_groq_api_key_here
LLM_MODEL=llama-3.3-70b-versatile

SCORE_THRESHOLD=0.35
STORAGE_TYPE=local
LOCAL_STORAGE_DIR=./storage
```

---

### Step 1: Start Qdrant Vector Store
Run Qdrant via Docker:
```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

---

### Step 2: Set Up Backend API
```bash
# 1. Activate Virtual Environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Apply database migrations
alembic -c backend/alembic.ini upgrade head

# 4. Start FastAPI Uvicorn Server
python -m uvicorn backend.main:app --reload --port 8000
```
- **Backend API**: http://localhost:8000
- **Swagger API Docs**: http://localhost:8000/docs

---

### Step 3: Set Up React Frontend
```bash
cd frontend
npm install
npm run dev
```
- **React Client**: http://localhost:5173

---

## 🔒 6. Security & Best Practices
- **Credential Protection**: Keys are isolated in `.env` and excluded via `.gitignore`.
- **Zero-Hallucination Enforcement**: Strict context grounding with `temperature=0.0`.
- **Async Non-Blocking I/O**: Asynchronous database and HTTP calls prevent event loop blocking.
- **XSS-Safe Markdown Rendering**: Custom HTML escaping prevents XSS injection via uploaded notes or chat inputs.
