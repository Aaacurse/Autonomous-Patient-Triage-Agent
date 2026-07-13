# Autonomous Patient Triage Agent

A production-shaped emergency department triage system that combines a LangGraph orchestration pipeline, real clinical NLP, and an LLM that autonomously decides when to pull a patient's prior visit history — built to model how a real ED triage workflow actually behaves, not a chatbot wrapper.

A nurse enters a patient's complaint and MRN. The system extracts symptoms, scores urgency using the industry-standard Emergency Severity Index (ESI 1–5), assigns a disposition zone, and streams every stage of that reasoning back in real time over WebSocket.

---

## Why this project exists

Most "AI triage" demos are a single LLM call wrapped in a form. This one is built around a harder, more honest question: **where should a model be trusted to decide, and where should it not be?**

- The **ESI level itself** is computed by deterministic, auditable rules — a clinical safety decision isn't something you want an LLM freelancing on.
- The **decision to check a patient's prior visit history** is genuinely made by the model, via real tool-calling — it looks at the complaint and decides whether history is relevant, rather than always or never fetching it.
- The **fact-check of whether that history actually contains a high-acuity prior visit** is computed in Python from the database record, not inferred by the LLM from its own prose summary — because that's a factual lookup, not a judgment call, and LLMs are not reliable at re-deriving facts they were just given.

That split — model judgment where judgment is warranted, deterministic code where a fact or a safety rule is what's needed — is the actual design thesis of this project.

---

## Architecture

```
Nurse (React UI)
      │  WebSocket
      ▼
FastAPI + LangGraph orchestration
      │
      ├─ intake_node            → session created, complaint logged
      │
      ├─ nlp_extract_node       → scispaCy entity extraction
      │                           + LLM (Groq, openai/gpt-oss-120b) structured extraction
      │                           + tool-call decision: check patient history? (autonomous)
      │                             └─ if yes → lookup_patient_history(mrn) → Postgres
      │
      ├─ esi_scorer_node        → deterministic ESI 1–5 scoring
      │                           (rules + repeat-high-acuity-visit signal from history)
      │
      └─ conditional edge       → disposition_node  or  escalate_node
                                    │
                                    ▼
                          streamed back to nurse via WebSocket,
                          persisted to Postgres (TriageSession + TriageRecord)
```

**Backend:** FastAPI, LangGraph, SQLAlchemy (async) + asyncpg, PostgreSQL, Alembic, JWT auth, WebSocket streaming
**NLP/LLM:** scispaCy for clinical entity extraction, LangChain + Groq (`openai/gpt-oss-120b`) for structured extraction and tool-calling
**Frontend:** React + Vite, real-time WebSocket updates, MRN-based search across a patient's full triage history

---

## Key design decisions

**Patients are identified by MRN, never by name.** Nurses type a Medical Record Number (`MRN-#####`); the name-to-patient lookup lives in a separate, secured hospital system that this project deliberately does not touch. No name, DOB, or address is ever stored — the schema only ever holds an opaque MRN string.

**History lookup is cross-nurse.** Any authenticated nurse can pull up a patient's full triage history via MRN, regardless of which nurse handled the earlier visits — this matches how continuity of care actually works in an ED. The `nurse_id` on each session still records who performed that specific triage, preserving the audit trail.

**MRN search is exact-match, not fuzzy.** A partial/fuzzy match risks surfacing the wrong patient's history in a clinical context — precision was chosen over convenience here.

**Agentic tool use is scoped narrowly and deliberately.** The model decides *whether* to check a patient's history — it does not decide the ESI score, and it does not decide the fact of whether a prior visit was high-acuity (that's computed directly from the stored `esi_level` integer). This keeps the system's autonomy where it adds value and its determinism where safety requires it.

---

## Project structure

```
backend/
  app/
    agent/
      graph.py       # LangGraph pipeline definition
      nodes.py       # intake / nlp_extract / esi_scorer / disposition nodes
      nlp.py         # scispaCy + Groq structured extraction, tool-calling history lookup
      state.py       # TriageState schema
    api/
      auth.py        # JWT auth endpoints
      triage.py       # REST endpoints (session list, session detail, search by MRN)
      websocket.py    # /ws/triage — real-time triage pipeline
    core/
      config.py       # settings (DB URL, Groq API key/model, JWT secret)
      security.py     # password hashing, JWT encode/decode
    db/
      models.py       # TriageSession, TriageRecord, User (SQLAlchemy ORM)
      crud.py         # DB query functions
      sessions.py     # async session/engine setup
  alembic/              # DB migrations
  main.py
  requirements.txt

frontend/
  src/
    api/triage.js       # REST client functions
    hooks/useWebSocket.js
    pages/Dashboard.jsx # New Triage form
    components/HistoryPanel.jsx  # History tab + MRN search
```

---

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with:
```
DATABASE_URL=postgresql+asyncpg://<user>:<password>@localhost:5432/<db_name>
GROQ_API_KEY=<your_groq_api_key>
SECRET_KEY=<your_jwt_secret>
```

Run migrations, then start the server:
```bash
alembic upgrade head
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default; the backend at `http://localhost:8000`.

---

## Try it

1. Register/log in as a nurse.
2. Start a new triage with a patient MRN (e.g. `MRN-00123`) and a complaint.
3. Watch the pipeline stream live: intake → NLP extraction → ESI scoring → disposition.
4. Submit a second, related complaint under the **same MRN** referencing the first visit (e.g. "this is happening again, like last time") — the model should autonomously decide to check history and factor a prior high-acuity visit into the new score.
5. Use the History tab to search a patient's full triage record by MRN.

---

## Roadmap

- [ ] Pytest test suite (unit tests for scoring logic, integration tests for the graph and WebSocket flow)
- [ ] CI pipeline (GitHub Actions) running tests on push
- [ ] Uncertainty-driven clarification loop — model asks a follow-up question when extraction confidence is low, instead of guessing
- [ ] Bounded self-reflection step — model checks its own ESI reasoning against the extracted evidence before finalizing
- [ ] Visible "history checked" indicator in the UI during a live triage run

---

## Disclaimer

This is a portfolio/demo project and is not a validated clinical tool. It should not be used to make real triage decisions.
