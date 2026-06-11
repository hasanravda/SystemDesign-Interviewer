# System Design Copilot

System Design Copilot is an AI-powered interview preparation workspace for system design, Java, Spring Boot, databases, distributed systems, APIs, low-level design, and object-oriented design problems.

Unlike a static design gallery, every requirement, diagram, API, data model, code file, test plan, scaling decision, and review is generated from the user's exact problem and saved session decisions. The server uses the OpenAI Responses API with strict structured outputs and persists session state locally.

## What it does

- Gathers editable functional requirements, non-functional requirements, constraints, assumptions, and clarifying questions before design begins.
- Generates problem-specific system context, architecture, data-flow, service-interaction, and ER diagrams in Mermaid.
- Creates API contracts, database design, caching, messaging, and tradeoff analysis.
- Generates runnable MVP source files for the selected backend and frontend stacks.
- Generates unit, integration, API, k6, and JMeter testing assets.
- Detects likely database, cache, API, and network bottlenecks using prior design decisions.
- Produces a capacity and multi-region scaling plan for 100 million daily active users or beyond.
- Generates optimization comparisons and PR summaries.
- Supports Copilot, Interviewer, Hints, and Expert Review conversation modes.

## Architecture

```text
Browser (React + Vite)
        │
        │ /api
        ▼
Express API ── OpenAI Responses API
        │
        └──── Local JSON session store (.data/sessions.json)
```

The OpenAI API key remains server-side. The browser never receives it.

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- An OpenAI API key with access to the configured model

## Configure

Copy the environment template and add your API key:

```bash
cp .env.example .env
```

Export the values before running the server. For Bash/Zsh:

```bash
set -a
source .env
set +a
```

Required and optional variables:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Yes | — | Server-side OpenAI API authentication. |
| `OPENAI_MODEL` | No | `gpt-5.5` | Model used for all reasoning and structured generation. |
| `PORT` | No | `3001` | Express API and production web server port. |
| `SESSION_STORE_PATH` | No | `.data/sessions.json` | JSON session persistence location. |

## Run in development

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. This runs:

- Vite frontend at `http://localhost:5173`
- Express API at `http://localhost:3001`
- A Vite proxy from `/api` to the Express API

Run each process separately when debugging:

```bash
npm run dev:server
npm run dev:client
```

## Run a production build locally

```bash
npm install
npm run build
NODE_ENV=production npm start
```

Open <http://localhost:3001>. Express serves both the API and the compiled frontend in production mode.

## Validate the installation

```bash
npm test
npm run build
curl http://localhost:3001/api/health
```

The health response reports whether AI is configured without exposing the API key:

```json
{
  "status": "ok",
  "aiConfigured": true,
  "model": "gpt-5.5"
}
```

## Workflow

1. Enter any interview or design problem and choose the desired backend/frontend stack.
2. Review and edit the AI-generated requirements; downstream artifacts are invalidated when requirements change.
3. Generate system design, runnable MVP, tests/load-testing assets, bottleneck analysis, scale plan, optimization report, and interview questions in sequence.
4. Inspect diagrams, code files, and metrics in the right artifact panel.
5. Use Copilot, Interviewer, Hints, or Expert Review mode to refine or challenge the current design.
6. Reopen saved sessions from the sidebar or landing page. All later phases receive previous requirements and artifacts as authoritative context.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health, AI configuration, and model status. |
| `GET` | `/api/sessions` | List saved session summaries. |
| `GET` | `/api/sessions/:id` | Load a complete saved session. |
| `POST` | `/api/sessions` | Analyze a new problem and gather requirements. |
| `PATCH` | `/api/sessions/:id/requirements` | Save edited requirements and invalidate downstream artifacts. |
| `POST` | `/api/sessions/:id/phases/:phase` | Generate a phase from accumulated session context. |
| `POST` | `/api/sessions/:id/messages` | Ask a context-aware follow-up in the selected mode. |

Supported generated phases are `design`, `mvp`, `testing`, `bottlenecks`, `scale`, `report`, and `interview`.

### Create a session

```bash
curl -X POST http://localhost:3001/api/sessions \
  -H 'Content-Type: application/json' \
  -d '{
    "problem": "Your interview problem here",
    "preferences": {
      "stack": "Spring Boot",
      "frontend": "React + TypeScript"
    }
  }'
```

### Generate the design phase

```bash
curl -X POST http://localhost:3001/api/sessions/SESSION_ID/phases/design \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## Security and operational behavior

- The API key is read only from the server environment.
- Helmet applies HTTP security headers.
- API requests are rate limited.
- Request JSON is size limited.
- User input length is validated.
- Structured output schemas keep AI responses predictable and renderable.
- Session data is persisted under `.data/`, which is excluded from Git.
- Production deployments should replace the local JSON store with a transactional database and deploy generated code execution/load testing into an isolated sandbox or CI worker.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start frontend and API with live reload. |
| `npm run dev:client` | Start only Vite. |
| `npm run dev:server` | Start only Express in watch mode. |
| `npm run build` | Compile the production frontend. |
| `npm test` | Run backend unit tests. |
| `npm start` | Start the Express API/server. |

## Project structure

```text
.
├── server/
│   ├── ai.js           # OpenAI orchestration, prompts, and strict schemas
│   ├── ai.test.js      # AI orchestration guard tests
│   ├── index.js        # Secure Express API
│   └── store.js        # Persistent session repository
├── src/
│   ├── main.jsx        # Stateful React interview workspace
│   └── styles.css      # Cream/purple professional UI
├── .env.example        # Safe environment configuration template
├── index.html
├── package.json
└── vite.config.js
```
