import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json());

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.post('/api/projects', async (req, res) => {
  await wait(650);
  const prompt = req.body.prompt || 'Design a reliable URL shortening service';
  res.json({
    id: `prj_${Date.now()}`,
    name: prompt.toLowerCase().includes('url') ? 'Minilink' : prompt.split(' ').slice(0, 4).join(' '),
    prompt,
    requirements: {
      functional: ['Create a short URL from a long URL', 'Redirect short links with low latency', 'Optional custom aliases', 'Basic click analytics'],
      nonFunctional: ['99.99% redirect availability', 'p95 redirect latency under 80ms', 'Links never expire by default', 'Read-heavy traffic pattern']
    }
  });
});

app.post('/api/projects/:id/build', async (_req, res) => {
  await wait(900);
  res.json({ status: 'ready', message: 'MVP generated and verified successfully.' });
});

app.post('/api/projects/:id/scale', async (_req, res) => {
  await wait(900);
  res.json({ status: 'optimized', before: '11.2K', after: '28.6K', latency: '42ms' });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.use((_req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));
}

app.listen(3001, () => console.log('SystemForge API running on http://localhost:3001'));
