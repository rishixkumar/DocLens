# DocLens — AI Document Analyzer

A full-stack AI-powered document analysis tool with React frontend, Express server, and FastAPI backend. Analyzes contracts, research papers, business reports, and general documents using Groq's Llama 3.3 70B model.

## Architecture

```
doclens/
├── frontend/     # React (Vite) - UI components, hooks, services
├── backend/      # FastAPI - Groq API, chunking, analysis logic
├── server/       # Express - Serves React build, proxies /api to FastAPI
└── doclens.html  # Legacy single-file version (deprecated)
```

## Tech Stack

- **Frontend:** React 18, Vite
- **Backend:** FastAPI (Python)
- **Server:** Express (Node.js)
- **AI:** Groq API (llama-3.3-70b-versatile)

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The Vite dev server proxies `/api` to the FastAPI backend.

### 3. Production (Optional)

```bash
# Build frontend
cd frontend && npm run build

# Start Express server (serves build + proxies API)
cd ../server
npm install
NODE_ENV=production node index.js
```

## Environment

### Backend (FastAPI)

Create `backend/.env` from the example (never commit `.env`):

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your Groq API key
```

| Variable     | Description |
|-------------|-------------|
| GROQ_API_KEY| Groq API key from [console.groq.com](https://console.groq.com) |

When `GROQ_API_KEY` is set, users do not need to enter an API key in the UI.

### Server (Express)

| Variable   | Default              | Description                    |
|-----------|----------------------|--------------------------------|
| PORT      | 5000                 | Express server port            |
| API_URL   | http://localhost:8000| FastAPI backend URL            |
| NODE_ENV  | development          | Set to `production` for build  |

## API Endpoints

- `POST /api/analyze` — Analyze document (body: document_text, document_type, api_key)
- `POST /api/search` — Semantic search (body: document_text, query, api_key)
- `GET /api/health` — Health check

## Testing

### Backend (pytest)

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

### Frontend (Vitest)

```bash
cd frontend
npm install
npm test
```

## Project Structure

### Frontend (`frontend/`)

- `src/components/` — React UI components
- `src/hooks/` — Custom hooks (useDocument, useApiKey)
- `src/services/` — API client
- `src/utils/` — PDF loader, helpers
- `src/styles/` — Global CSS

### Backend (`backend/`)

- `app/api/routes/` — FastAPI route handlers
- `app/services/` — Groq API, chunking logic
- `app/models/` — Pydantic schemas
- `tests/` — Pytest test suite

### Server (`server/`)

- `index.js` — Express app, static serve, API proxy

## License

MIT
