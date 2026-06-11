import test from 'node:test';
import assert from 'node:assert/strict';
import { gatherRequirements, generatePhase } from './ai.js';

test('rejects unknown workflow phases before making an AI request', () => {
  assert.throws(() => generatePhase({ problem: 'Design a system', requirements: {}, artifacts: {} }, 'unknown'), /Unknown phase/);
});

test('requires a server-side OpenAI API key', async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  await assert.rejects(() => gatherRequirements('Explain the JVM memory model'), /OPENAI_API_KEY/);
  if (original) process.env.OPENAI_API_KEY = original;
});
