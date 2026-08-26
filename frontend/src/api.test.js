import assert from 'node:assert/strict';
import test from 'node:test';
import { apiFetch, shouldRetryColdStart } from './api.js';

test('recognizes retry-safe cold-start responses', () => {
  assert.equal(shouldRetryColdStart('GET', 503), true);
  assert.equal(shouldRetryColdStart('HEAD', 504), true);
  assert.equal(shouldRetryColdStart('POST', 503), false);
  assert.equal(shouldRetryColdStart('GET', 500), false);
});

test('retries one GET request after a cold-start response', async () => {
  const originalFetch = globalThis.fetch;
  const responses = [{ status: 503 }, { status: 200 }];
  let calls = 0;
  globalThis.fetch = async () => responses[calls++];

  try {
    const response = await apiFetch('/api/example');
    assert.equal(response.status, 200);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('does not retry a non-idempotent request', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return { status: 503 };
  };

  try {
    const response = await apiFetch('/api/example', { method: 'POST' });
    assert.equal(response.status, 503);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
