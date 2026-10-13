/**
 * AMD WebScout: Cryptographic Provenance Ledger
 * Produces verifiable SHA-256 evidence chains linking natural-language queries,
 * retrieved source payloads, exact quotes, and extracted entities.
 */

import { createHash } from 'node:crypto';

export class ProvenanceLedger {
  constructor() {
    this.entries = [];
    this.chain = [];
  }

  /**
   * Hashes any string payload with SHA-256.
   * @param {string} data
   * @returns {string} Hex SHA-256 digest
   */
  static hash(data) {
    return createHash('sha256').update(String(data), 'utf8').digest('hex');
  }

  /**
   * Records a retrieval extraction event into the tamper-evident ledger.
   * @param {object} event { query, url, facts, prunedText }
   * @returns {object} Audit receipt
   */
  record(event) {
    const prevHash = this.chain.length > 0
      ? this.chain[this.chain.length - 1].entryHash
      : '0000000000000000000000000000000000000000000000000000000000000000';

    const timestamp = new Date().toISOString();
    const sourcePayloadHash = ProvenanceLedger.hash(event.prunedText || '');
    const queryHash = ProvenanceLedger.hash(event.query || '');

    const recordData = {
      index: this.chain.length + 1,
      timestamp,
      query: event.query,
      queryHash,
      sourceUrl: event.url,
      sourcePayloadHash,
      factsCount: (event.facts || []).length,
      factsSummary: (event.facts || []).map((f) => ({ type: f.entityType, value: f.value, conf: f.confidence })),
      prevHash
    };

    const entryHash = ProvenanceLedger.hash(JSON.stringify(recordData));

    const receipt = {
      ...recordData,
      entryHash
    };

    this.chain.push(receipt);
    return receipt;
  }

  /**
   * Verifies the full cryptographic integrity of the audit chain.
   * @returns {object} Verification status
   */
  verify() {
    let valid = true;
    let headHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < this.chain.length; i++) {
      const entry = this.chain[i];

      if (i === 0) {
        if (entry.prevHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
          valid = false;
          break;
        }
      } else {
        if (entry.prevHash !== this.chain[i - 1].entryHash) {
          valid = false;
          break;
        }
      }

      // Recompute hash
      const { entryHash, ...dataToHash } = entry;
      const expectedHash = ProvenanceLedger.hash(JSON.stringify(dataToHash));
      if (entryHash !== expectedHash) {
        valid = false;
        break;
      }

      headHash = entryHash;
    }

    return {
      valid,
      length: this.chain.length,
      headHash,
      timestamp: new Date().toISOString()
    };
  }
}
