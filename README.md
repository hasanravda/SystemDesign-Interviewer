# SystemForge

SystemForge is a full-stack system-design workspace that turns a product idea—such as **“Design a tiny URL service”**—into an understandable MVP plan.

The application walks through the complete design workflow in one interface:

1. Gather functional and non-functional requirements.
2. Ask the user whether additional requirements are needed.
3. Visualize the proposed architecture.
4. Define API contracts and a data model.
5. Show the generated MVP implementation and local preview.
6. Present load-test results and identify bottlenecks.
7. Propose architecture and code optimizations for 100 million active users.
8. Summarize the performance improvements and generate a PR summary.

> [!NOTE]
> This repository currently provides an interactive product prototype. The Express API returns deterministic demo data and simulates build and scaling operations; it does not yet invoke an AI model, generate a separate source repository, or execute real load tests.

## Technology stack

- **Frontend:** React, Vite, Lucide React
- **Backend:** Node.js, Express
- **Styling:** Custom CSS
- **Development tooling:** Concurrently, Vite development proxy

## Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) 20.19 or newer
- npm 10 or newer

Confirm your installed versions:

```bash
node --version
npm --version
```

## Run locally for development

From the repository root:

```bash
npm install
npm run dev
```

This starts both application processes:

| Service | URL | Purpose |
| --- | --- | --- |
| React/Vite frontend | <http://localhost:5173> | Main SystemForge interface |
| Express API | <http://localhost:3001> | Project, build, scaling, and health endpoints |

Open <http://localhost:5173> in a browser. Vite proxies frontend requests beginning with `/api` to the Express server.

To stop both processes, press `Ctrl+C` in the terminal running `npm run dev`.

### Run frontend and backend separately

Use separate terminals when debugging only one side of the application.

**Terminal 1 — API server:**

```bash
npm run dev:server
```

**Terminal 2 — frontend:**

```bash
npm run dev:client
```

Then open <http://localhost:5173>.

## Run the production build locally

Build the frontend and start Express in production mode:

```bash
npm install
npm run build
NODE_ENV=production npm start
```

Open <http://localhost:3001>. In production mode, Express serves both the API and the compiled frontend from `dist/`.

> [!TIP]
> On Windows PowerShell, set the environment variable before starting the app:
>
> ```powershell
> $env:NODE_ENV="production"
> npm start
> ```

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite frontend and Express API together with live reload. |
| `npm run dev:client` | Start only the Vite frontend on port `5173`. |
| `npm run dev:server` | Start only the Express API on port `3001` with watch mode. |
| `npm run build` | Create the production frontend bundle in `dist/`. |
| `npm start` | Start the Express server; set `NODE_ENV=production` to serve the built frontend too. |

## Using SystemForge

1. Enter a system-design prompt on the welcome screen or select an example.
2. Select **Start designing** to create the project workspace.
3. Review the automatically gathered functional and non-functional requirements.
4. Add optional requirements such as authentication or link expiry.
5. Switch between **Architecture**, **API Contracts**, and **Data model** in the center panel.
6. Select **Build & run locally** in the Build panel to simulate generating and launching the MVP.
7. Open **Performance** to review throughput, latency, health metrics, and the detected bottleneck.
8. Select **Scale to 100M users** to review and apply the scaling plan.
9. Review the updated architecture and optimization summary, then generate the PR summary.

## API endpoints

The development API is available at `http://localhost:3001`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Check whether the API is running. |
| `POST` | `/api/projects` | Create a demo project and return gathered requirements. |
| `POST` | `/api/projects/:id/build` | Simulate generating and verifying an MVP. |
| `POST` | `/api/projects/:id/scale` | Simulate optimizing the project for a larger scale target. |

### Example API requests

Check API health:

```bash
curl http://localhost:3001/api/health
```

Create a project:

```bash
curl -X POST http://localhost:3001/api/projects \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Design a tiny URL service"}'
```

Simulate an MVP build:

```bash
curl -X POST http://localhost:3001/api/projects/demo-project/build
```

Simulate the 100-million-user optimization:

```bash
curl -X POST http://localhost:3001/api/projects/demo-project/scale
```

## Project structure

```text
.
├── index.html          # Vite HTML entry point
├── server/
│   └── index.js        # Express API and production static server
├── src/
│   ├── main.jsx        # React application and workflow UI
│   └── styles.css      # Application visual design
├── package.json        # Dependencies and npm commands
└── vite.config.js      # React plugin and development API proxy
```

## Troubleshooting

### The frontend loads, but API actions fail

Make sure the Express server is running on port `3001`. The easiest option is to run both services together:

```bash
npm run dev
```

### Port 3001 or 5173 is already in use

Stop the process using the port, or update the server port in `server/index.js` and the corresponding proxy target in `vite.config.js`.

### The production URL shows no frontend

The production frontend must be built before starting Express, and `NODE_ENV` must be set to `production`:

```bash
npm run build
NODE_ENV=production npm start
```

### Reset local dependencies

```bash
rm -rf node_modules dist
npm install
npm run dev
```
