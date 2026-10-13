import { test } from 'node:test';
import { strictEqual, ok } from 'node:assert';

import { createWebScoutServer } from '../src/server.mjs';

test('11. Server exposes health, verification, and retrieval endpoints', async () => {
  const { server } = createWebScoutServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    strictEqual(healthData.status, 'HEALTHY');

    // 2. Static HTML check
    const rootRes = await fetch(`${baseUrl}/`);
    strictEqual(rootRes.status, 200);
    const htmlText = await rootRes.text();
    ok(htmlText.includes('AMD WebScout'));

    // 3. API Retrieval check
    const retrieveRes = await fetch(`${baseUrl}/api/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Find memory capacity of AMD MI300X' })
    });
    strictEqual(retrieveRes.status, 200);
    const result = await retrieveRes.json();
    ok(result.success);
    ok(result.facts.length > 0);
    ok(result.provenanceReceipt.entryHash);

    // 4. Ledger verification check
    const verifyRes = await fetch(`${baseUrl}/api/verify`);
    strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    strictEqual(verifyData.valid, true);

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
