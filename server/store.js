import fs from 'node:fs/promises';
import path from 'node:path';

const storePath = process.env.SESSION_STORE_PATH || '.data/sessions.json';

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(storePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeAll(sessions) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(sessions, null, 2));
}

export async function listSessions() {
  return (await readAll()).map(({ id, problem, category, updatedAt, phase }) => ({ id, problem, category, updatedAt, phase }));
}

export async function getSession(id) {
  return (await readAll()).find((session) => session.id === id);
}

export async function saveSession(session) {
  const sessions = await readAll();
  const index = sessions.findIndex((item) => item.id === session.id);
  if (index >= 0) sessions[index] = session;
  else sessions.unshift(session);
  await writeAll(sessions);
  return session;
}
