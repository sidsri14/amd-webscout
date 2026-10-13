/**
 * AMD WebScout: HTTP API & Interactive Server
 * Exposes live web retrieval endpoints and serves the visual dashboard.
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AMDWebScoutAgent } from './index.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

export function createWebScoutServer(options = {}) {
  const agent = new AMDWebScoutAgent(options);

  // Preset mock documentation pages for deterministic live demonstration
  const mockKnowledgeBase = {
    'https://instinct.amd.com': `
      <!DOCTYPE html>
      <html>
        <head><title>AMD Instinct Accelerators</title><style>.banner{color:red}</style></head>
        <body>
          <nav><a href="https://instinct.amd.com/mi300x">MI300X Architecture</a> | <a href="https://instinct.amd.com/rocm">ROCm Ecosystem</a></nav>
          <h1>AMD Instinct AI Compute Platforms</h1>
          <p>Next-generation compute platforms powering frontier generative AI foundation models.</p>
          <a href="https://instinct.amd.com/mi300x">Explore AMD Instinct MI300X Specifications and Enterprise Pricing</a>
          <script src="/tracking.js"></script>
        </body>
      </html>
    `,
    'https://instinct.amd.com/mi300x': `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>AMD Instinct MI300X Accelerator Architecture</h1>
          <p>Engineered for enterprise LLM training and high-throughput real-time inference.</p>
          <p>The MI300X accelerator delivers 192GB HBM3 memory capacity with 5.3 TB/s peak theoretical bandwidth.</p>
          <p>Enterprise cloud deployment pricing starts at $15,000 USD per accelerator node cluster.</p>
          <p>Official global commercial release occurred on December 06, 2024 with complete ROCm 6.2 ecosystem support.</p>
          <table>
            <tr><th>Feature</th><th>Specification</th></tr>
            <tr><td>Architecture</td><td>CDNA3 (gfx942)</td></tr>
            <tr><td>Memory</td><td>192GB HBM3</td></tr>
            <tr><td>FP8 Performance</td><td>2,610 TFLOPS</td></tr>
            <tr><td>Thermal Power</td><td>750 Watts TDP</td></tr>
          </table>
        </body>
      </html>
    `
  };

  // Configure fetcher to use mock knowledge base or fetch real HTTP URLs
  agent.navigator.fetcher = async (url) => {
    if (mockKnowledgeBase[url]) {
      return mockKnowledgeBase[url];
    }
    // Attempt standard HTTP fetch with timeout if available
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'AMD-WebScout-Agent/1.0' } });
      if (res.ok) return await res.text();
    } catch {
      // Fallback
    }
    return null;
  };

  const server = createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // Health / Status Endpoint
    if (pathname === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'HEALTHY', agent: 'AMD-WebScout-v1.0' }));
      return;
    }

    // Ledger Verification Endpoint
    if (pathname === '/api/verify' && req.method === 'GET') {
      const proof = agent.verifyLedger();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(proof));
      return;
    }

    // Retrieve Mission Endpoint
    if (pathname === '/api/retrieve' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        try {
          const { query, startUrl } = JSON.parse(body || '{}');
          if (!query) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Query parameter is required' }));
            return;
          }

          const targetUrl = startUrl || 'https://instinct.amd.com';
          const startHtml = mockKnowledgeBase[targetUrl] || '';

          const result = await agent.retrieve(query, {
            url: targetUrl,
            html: startHtml
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Serve Static UI Assets
    if (req.method === 'GET') {
      let filePath = pathname === '/' ? join(publicDir, 'index.html') : join(publicDir, pathname);

      if (existsSync(filePath)) {
        const ext = filePath.split('.').pop();
        const mimeTypes = {
          html: 'text/html',
          css: 'text/css',
          js: 'application/javascript',
          json: 'application/json',
          png: 'image/png',
          svg: 'image/svg+xml'
        };
        const contentType = mimeTypes[ext] || 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(readFileSync(filePath));
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  return { server, agent };
}

// Direct execution CLI launcher
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 4100;
  const { server } = createWebScoutServer();
  server.listen(port, () => {
    console.log(`⚡ AMD WebScout UI & API Server running at http://127.0.0.1:${port}`);
  });
}
