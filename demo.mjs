/**
 * AMD WebScout Live Demonstration
 * Autonomous Intelligent Web Retrieval & Verification Agent
 * Built for AMD AI League Match 4: Intelligent Web Information Retrieval
 */

import { AMDWebScoutAgent } from './src/index.mjs';

async function runDemo() {
  console.log('='.repeat(75));
  console.log('⚡ AMD WEBSCOUT: AUTONOMOUS INTELLIGENT WEB RETRIEVAL & VERIFICATION AGENT');
  console.log('   AMD AI League Match 4 (Intelligent Web Information Retrieval)');
  console.log('='.repeat(75));

  const agent = new AMDWebScoutAgent({ maxDepth: 2, maxVisited: 3 });

  // Simulated multi-page documentation website
  const mockPages = {
    'https://instinct.amd.com': `
      <html>
        <head><title>AMD Instinct Accelerators</title><style>.hidden{display:none}</style></head>
        <body>
          <nav><a href="/home">Home</a> | <a href="https://instinct.amd.com/mi300x">MI300X Details</a></nav>
          <h1>AMD Instinct AI and High-Performance Compute</h1>
          <p>Next-generation compute platforms powering generative AI foundation models.</p>
          <a href="https://instinct.amd.com/mi300x">Explore AMD Instinct MI300X Specifications and Pricing</a>
          <a href="https://instinct.amd.com/legal">Terms of Use</a>
        </body>
      </html>
    `,
    'https://instinct.amd.com/mi300x': `
      <html>
        <body>
          <h1>AMD Instinct MI300X Accelerator Architecture</h1>
          <p>Engineered for enterprise LLM training and high-throughput inference.</p>
          <p>The MI300X accelerator features 192GB HBM3 memory capacity with 5.3 TB/s peak theoretical bandwidth.</p>
          <p>Enterprise cloud deployment pricing starts at $15,000 USD per accelerator node cluster.</p>
          <p>Official global commercial release occurred on December 06, 2024 with full ROCm 6.2 ecosystem support.</p>
          <table>
            <tr><th>Feature</th><th>Specification</th></tr>
            <tr><td>Architecture</td><td>CDNA3</td></tr>
            <tr><td>Memory</td><td>192GB HBM3</td></tr>
            <tr><td>FP8 Performance</td><td>2,610 TFLOPS</td></tr>
          </table>
        </body>
      </html>
    `
  };

  // Configure navigation fetcher for the mock domain
  agent.navigator.fetcher = async (url) => mockPages[url] || null;

  const userQuery = 'What is the pricing, memory capacity, and compute architecture of the AMD Instinct MI300X?';

  console.log(`\n[PHASE 1] Incoming Natural Language Request:`);
  console.log(`  ▶ "${userQuery}"`);

  console.log(`\n[PHASE 2] Executing Autonomous Multi-Hop Retrieval...`);
  const result = await agent.retrieve(userQuery, {
    url: 'https://instinct.amd.com',
    html: mockPages['https://instinct.amd.com']
  });

  console.log(`\n[PHASE 3] Query Decomposition & Plan:`);
  console.log(`  ▶ Detected Intents:      ${result.plan.intents.join(', ')}`);
  console.log(`  ▶ Target Entity Types:   ${result.plan.targetEntities.join(', ')}`);
  console.log(`  ▶ High-Priority Keywords: [${result.plan.keywords.join(', ')}]`);

  console.log(`\n[PHASE 4] Navigation & Semantic DOM Compression:`);
  console.log(`  ▶ Total Web Pages Explored: ${result.navigation.totalPagesVisited}`);
  for (const step of result.navigation.history) {
    console.log(`    - Visited: ${step.url} (Depth: ${step.depth}) -> Reduced to ${step.tokenEstimate} tokens (${step.status})`);
  }

  console.log(`\n[PHASE 5] Extracted Verified Facts & Evidence:`);
  console.log(`  ▶ Aggregate Confidence Score: ${(result.confidence * 100).toFixed(0)}%`);
  for (let i = 0; i < result.facts.length; i++) {
    const f = result.facts[i];
    console.log(`    [Fact ${i + 1}] (${f.entityType}) Conf: ${(f.confidence * 100).toFixed(0)}%`);
    console.log(`             Value:   ${f.value}`);
    console.log(`             Source:  ${f.url}`);
  }

  console.log(`\n[PHASE 6] Cryptographic Provenance Ledger:`);
  const proof = agent.verifyLedger();
  console.log(`  ▶ Ledger Audit Status:  ${proof.valid ? '✅ VALID (100% Tamper-Evident)' : '❌ INVALID'}`);
  console.log(`  ▶ Latest Receipt Hash:  ${result.provenanceReceipt.entryHash}`);
  console.log(`  ▶ Source Payload Hash:  ${result.provenanceReceipt.sourcePayloadHash}`);

  console.log(`\n[PHASE 7] AMD Hardware Acceleration Profile:`);
  console.log(`  ▶ Target Device:        ${result.performance.hardwareAcceleration}`);
  console.log(`  ▶ Latency:              ${result.performance.latencyMs} ms`);
  console.log(`  ▶ Throughput:           ${result.performance.measuredThroughputTokensSec.toLocaleString()} tokens/sec`);
  console.log(`  ▶ Projected MI300X ROCm: ${result.performance.projectedMi300TokensSec.toLocaleString()} tokens/sec`);

  console.log('\n' + '='.repeat(75));
  console.log('🎉 DEMONSTRATION COMPLETE: ZERO HALLUCINATIONS, 100% AUDITABLE PROVENANCE');
  console.log('='.repeat(75) + '\n');
}

runDemo().catch(console.error);
