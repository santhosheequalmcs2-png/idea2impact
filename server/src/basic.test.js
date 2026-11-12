import test from 'node:test';
import assert from 'node:assert/strict';

test('autonomous innovation AI operates in heuristic mode when OPENAI_API_KEY is absent', async () => {
  const old = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const { askAI } = await import('./services/ai.js');
  const result = await askAI('Help me plan a prototype');
  assert.equal(result.mode, 'heuristic');
  assert.equal(result.type, 'prototyping');
  assert.match(result.reply, /Rapid Prototyping/i);
  if (old) process.env.OPENAI_API_KEY = old;
});

test('autonomous innovation AI provides patentability and strategy advisory', async () => {
  delete process.env.OPENAI_API_KEY;
  const { askAI } = await import('./services/ai.js');
  const result = await askAI('Patent and novelty analysis for my invention');
  assert.equal(result.mode, 'heuristic');
  assert.equal(result.type, 'patentability');
  assert.match(result.reply, /AI Patentability & Prior-Art Scan/i);
  assert.ok(result.noveltyScore > 0);
});
