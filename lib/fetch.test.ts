import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchJson } from './fetch';

test('fetchJson resolves successful JSON payloads', async () => {
  const payload = { ok: true };
  const response = new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await fetchJson(response);

  assert.deepEqual(result, payload);
});

test('fetchJson rejects when the response is not successful', async () => {
  const response = new Response(JSON.stringify({ message: 'Nope' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });

  await assert.rejects(() => fetchJson(response), /Nope|HTTP 500/);
});

test('fetchJson rejects when the network call fails', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Failed to fetch');
  };

  try {
    await assert.rejects(() => fetchJson('/api/test'), /Failed to fetch/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
