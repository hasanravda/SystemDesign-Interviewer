import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { answerFollowUp, gatherRequirements, generatePhase } from './ai.js';
import { getSession, listSessions, saveSession } from './store.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phases = ['requirements', 'design', 'mvp', 'testing', 'bottlenecks', 'scale', 'report', 'interview'];

app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"] } } }));
app.use(express.json({ limit: '2mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', aiConfigured: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_MODEL || 'gpt-5.5' }));
app.get('/api/sessions', async (_req, res, next) => { try { res.json(await listSessions()); } catch (error) { next(error); } });
app.get('/api/sessions/:id', async (req, res, next) => { try { const session = await getSession(req.params.id); session ? res.json(session) : res.status(404).json({ error: 'Session not found.' }); } catch (error) { next(error); } });

app.post('/api/sessions', async (req, res, next) => {
  try {
    const problem = String(req.body.problem || '').trim();
    if (problem.length < 8 || problem.length > 5000) return res.status(400).json({ error: 'Problem must be between 8 and 5,000 characters.' });
    const requirements = await gatherRequirements(problem);
    const now = new Date().toISOString();
    const session = { id: crypto.randomUUID(), problem, category: requirements.category, preferences: req.body.preferences || {}, requirements, artifacts: {}, messages: [], phase: 'requirements', createdAt: now, updatedAt: now };
    await saveSession(session); res.status(201).json(session);
  } catch (error) { next(error); }
});

app.patch('/api/sessions/:id/requirements', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id); if (!session) return res.status(404).json({ error: 'Session not found.' });
    session.requirements = { ...session.requirements, ...req.body }; session.artifacts = {}; session.phase = 'requirements'; session.updatedAt = new Date().toISOString();
    await saveSession(session); res.json(session);
  } catch (error) { next(error); }
});

app.post('/api/sessions/:id/phases/:phase', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id); if (!session) return res.status(404).json({ error: 'Session not found.' });
    if (!phases.includes(req.params.phase) || req.params.phase === 'requirements') return res.status(400).json({ error: 'Invalid phase.' });
    session.preferences = { ...session.preferences, ...(req.body.preferences || {}) };
    session.artifacts[req.params.phase] = await generatePhase(session, req.params.phase); session.phase = req.params.phase; session.updatedAt = new Date().toISOString();
    await saveSession(session); res.json(session);
  } catch (error) { next(error); }
});

app.post('/api/sessions/:id/messages', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id); if (!session) return res.status(404).json({ error: 'Session not found.' });
    const message = String(req.body.message || '').trim(); if (!message) return res.status(400).json({ error: 'Message is required.' });
    const response = await answerFollowUp(session, message, req.body.mode || 'copilot');
    session.messages.push({ id: crypto.randomUUID(), message, mode: req.body.mode || 'copilot', response, createdAt: new Date().toISOString() }); session.updatedAt = new Date().toISOString();
    await saveSession(session); res.json(session);
  } catch (error) { next(error); }
});

if (process.env.NODE_ENV === 'production') { app.use(express.static(path.join(__dirname, '../dist'))); app.use((_req, res) => res.sendFile(path.join(__dirname, '../dist/index.html'))); }
app.use((error, _req, res, _next) => { console.error(error); res.status(error.status || 500).json({ error: error.message || 'Unexpected server error.' }); });

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`System Design Copilot API listening on http://localhost:${port}`));
