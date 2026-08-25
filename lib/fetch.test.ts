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
  await assert.rejects(
    () => fetchJson(() => Promise.reject(new Error('Failed to fetch')) as any),
    /Failed to fetch/
  );
});
