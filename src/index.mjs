/**
 * AMD WebScout: Main Orchestrator
 * End-to-end intelligent web retrieval, navigation, and cryptographic verification agent.
 */

import { QueryPlanner } from './query_planner.mjs';
import { DomPruner } from './dom_pruner.mjs';
import { Navigator } from './navigator.mjs';
import { Extractor } from './extractor.mjs';
import { ProvenanceLedger } from './provenance.mjs';
import { RocmBenchmark } from './rocm_benchmark.mjs';

export class AMDWebScoutAgent {
  constructor(options = {}) {
    this.navigator = new Navigator(options);
    this.ledger = new ProvenanceLedger();
  }

  /**
   * Runs an end-to-end web information retrieval mission.
   * @param {string} prompt Natural-language query
   * @param {object} startPage { url, html }
   * @returns {Promise<object>} Complete retrieval results with cryptographic provenance
   */
  async retrieve(prompt, startPage) {
    const startTime = performance.now();

    // 1. Decompose and plan query
    const plan = QueryPlanner.plan(prompt);

    // 2. Navigate and prune pages
    const exploration = await this.navigator.explore(startPage, plan);

    // 3. Extract targeted structured information
    const extraction = Extractor.extract(exploration.pages, plan);

    // 4. Compute token throughput & metrics
    const totalTokens = exploration.pages.reduce((sum, p) => sum + p.pruned.tokenEstimate, 0);
    const elapsedMs = performance.now() - startTime;
    const performanceMetrics = RocmBenchmark.evaluateMetrics(totalTokens, elapsedMs);

    // 5. Anchor in cryptographic provenance ledger
    const receipt = this.ledger.record({
      query: prompt,
      url: startPage.url,
      facts: extraction.facts,
      prunedText: exploration.pages.map((p) => p.pruned.text).join('\n---\n')
    });

    return {
      query: prompt,
      plan,
      success: extraction.success,
      confidence: extraction.confidence,
      facts: extraction.facts,
      citations: extraction.citations,
      navigation: {
        totalPagesVisited: exploration.totalVisited,
        history: exploration.history
      },
      performance: performanceMetrics,
      provenanceReceipt: receipt
    };
  }

  /**
   * Verifies the cryptographic audit ledger.
   * @returns {object} Verification status
   */
  verifyLedger() {
    return this.ledger.verify();
  }
}

export {
  QueryPlanner,
  DomPruner,
  Navigator,
  Extractor,
  ProvenanceLedger,
  RocmBenchmark
};
