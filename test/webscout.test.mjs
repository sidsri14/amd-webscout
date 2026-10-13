import { test } from 'node:test';
import { strictEqual, ok, deepStrictEqual, throws } from 'node:assert';

import {
  AMDWebScoutAgent,
  QueryPlanner,
  DomPruner,
  Navigator,
  Extractor,
  ProvenanceLedger,
  RocmBenchmark
} from '../src/index.mjs';

test('1. QueryPlanner identifies pricing intent and extracts keywords', () => {
  const plan = QueryPlanner.plan('Find the price of AMD Instinct MI300X accelerator');
  ok(plan.intents.includes('PRICING_EXTRACTION'));
  ok(plan.targetEntities.includes('price'));
  ok(plan.keywords.includes('amd'));
  ok(plan.keywords.includes('instinct'));
  ok(plan.keywords.includes('mi300x'));
  strictEqual(plan.maxHops, 3);
});

test('2. QueryPlanner rejects empty or invalid prompts', () => {
  throws(() => QueryPlanner.plan(''), /must be a non-empty string/);
  throws(() => QueryPlanner.plan(null), /must be a non-empty string/);
});

test('3. DomPruner compresses HTML and removes scripts and styling', () => {
  const dirtyHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>body { background: red; }</style>
        <script>console.log("tracking pixel");</script>
      </head>
      <body>
        <!-- Header banner -->
        <h1>AMD Instinct MI300X Accelerator</h1>
        <p>The world's leading generative AI accelerator delivers 192GB of HBM3 memory.</p>
        <script src="analytics.js"></script>
      </body>
    </html>
  `;
  const result = DomPruner.prune(dirtyHtml, 'https://amd.com');
  ok(!result.text.includes('console.log'));
  ok(!result.text.includes('background: red'));
  ok(result.text.includes('AMD Instinct MI300X'));
  ok(result.text.includes('192GB'));
  ok(result.compressionRatio > 0.4);
});

test('4. DomPruner extracts candidate links and table data', () => {
  const html = `
    <div>
      <a href="/specs">View MI300X Specifications</a>
      <a href="/pricing">View Cloud Pricing</a>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Memory Capacity</td><td>192GB HBM3</td></tr>
        <tr><td>Peak Theoretical Bandwidth</td><td>5.3 TB/s</td></tr>
      </table>
    </div>
  `;
  const result = DomPruner.prune(html, 'https://amd.com');
  strictEqual(result.links.length, 2);
  strictEqual(result.links[0].url, 'https://amd.com/specs');
  strictEqual(result.tables.length, 1);
  strictEqual(result.tables[0].length, 3);
});

test('5. Navigator scores candidate links according to query keywords', () => {
  const navigator = new Navigator();
  const link1 = { text: 'Technical Specifications and Architecture', url: 'https://amd.com/specs' };
  const link2 = { text: 'Terms of Service and Privacy Policy', url: 'https://amd.com/legal' };

  const score1 = navigator.scoreLink(link1, ['specs', 'mi300x']);
  const score2 = navigator.scoreLink(link2, ['specs', 'mi300x']);

  ok(score1 > 0.5, `Expected score1 > 0.5, got ${score1}`);
  ok(score2 < 0.2, `Expected score2 < 0.2, got ${score2}`);
});

test('6. Extractor identifies targeted prices and technical specifications', () => {
  const pages = [
    {
      url: 'https://amd.com/products/accelerators/instinct-mi300x',
      depth: 0,
      pruned: {
        text: 'The AMD Instinct MI300X is available at $15,000 USD per accelerator.\nIt features 192GB HBM3 memory and 5.3 TB/s peak bandwidth.',
        tables: []
      }
    }
  ];

  const plan = QueryPlanner.plan('What is the price and memory of AMD MI300X?');
  const extraction = Extractor.extract(pages, plan);

  ok(extraction.success);
  ok(extraction.facts.length >= 2);
  const priceFact = extraction.facts.find((f) => f.entityType === 'PRICE');
  ok(priceFact, 'Expected a price fact');
  ok(priceFact.value.includes('$15,000'));
});

test('7. ProvenanceLedger records cryptographic hash chains', () => {
  const ledger = new ProvenanceLedger();
  const r1 = ledger.record({
    query: 'MI300X VRAM',
    url: 'https://amd.com',
    facts: [{ entityType: 'SPECIFICATION', value: '192GB', confidence: 0.95 }],
    prunedText: 'MI300X has 192GB'
  });

  const r2 = ledger.record({
    query: 'MI300X Bandwidth',
    url: 'https://amd.com',
    facts: [{ entityType: 'SPECIFICATION', value: '5.3 TB/s', confidence: 0.95 }],
    prunedText: 'MI300X has 5.3 TB/s'
  });

  strictEqual(ledger.chain.length, 2);
  strictEqual(r2.prevHash, r1.entryHash);

  const verification = ledger.verify();
  ok(verification.valid, 'Audit ledger must be cryptographically valid');
  strictEqual(verification.length, 2);
});

test('8. ProvenanceLedger detects tampering when entry is mutated', () => {
  const ledger = new ProvenanceLedger();
  ledger.record({ query: 'Q1', url: 'https://test.com', facts: [], prunedText: 'T1' });
  ledger.record({ query: 'Q2', url: 'https://test.com', facts: [], prunedText: 'T2' });

  // Tamper with first entry
  ledger.chain[0].query = 'TAMPERED QUERY';

  const verification = ledger.verify();
  strictEqual(verification.valid, false, 'Audit verification must fail closed on tampered entry');
});

test('9. RocmBenchmark returns hardware profile and token throughput', () => {
  const hw = RocmBenchmark.detectHardware();
  ok(hw.targetDevice);
  ok(hw.vramAvailableMB > 0);

  const metrics = RocmBenchmark.evaluateMetrics(10000, 250);
  ok(metrics.tokensProcessed === 10000);
  ok(metrics.measuredThroughputTokensSec > 0);
  ok(metrics.projectedMi300TokensSec > metrics.measuredThroughputTokensSec);
});

test('10. End-to-end AMDWebScoutAgent retrieval pipeline executes seamlessly', async () => {
  const agent = new AMDWebScoutAgent({ maxDepth: 2, maxVisited: 3 });

  const mockStartPage = {
    url: 'https://rocm.docs.amd.com/overview',
    html: `
      <html>
        <body>
          <h1>AMD ROCm 6.2 Platform Release</h1>
          <p>Released on September 15, 2026 for high-performance AI workloads.</p>
          <a href="https://rocm.docs.amd.com/benchmarks">View Benchmark Results</a>
          <p>AMD Instinct MI300X delivers 192GB of HBM3 memory and 163 TFLOPS of FP32 compute.</p>
        </body>
      </html>
    `
  };

  const result = await agent.retrieve('Find the memory specifications and release date of ROCm 6.2', mockStartPage);

  ok(result.success);
  ok(result.facts.length > 0);
  ok(result.confidence > 0.6);
  ok(result.provenanceReceipt.entryHash);
  ok(result.performance.measuredThroughputTokensSec > 0);

  const proof = agent.verifyLedger();
  ok(proof.valid);
});
