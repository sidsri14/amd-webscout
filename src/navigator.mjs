/**
 * AMD WebScout: Autonomous Multi-Hop Navigator
 * Explores websites, ranks hyperlinks based on semantic intent,
 * and traverses multi-step information discovery graphs.
 */

import { DomPruner } from './dom_pruner.mjs';

export class Navigator {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth ?? 3;
    this.maxVisited = options.maxVisited ?? 10;
    this.fetcher = options.fetcher ?? null; // Custom fetcher or offline provider
    this.visitedUrls = new Set();
    this.history = [];
  }

  /**
   * Scores a candidate link against query keywords and intents.
   * @param {object} link { url, text, anchor }
   * @param {string[]} keywords
   * @returns {number} Score from 0 to 1
   */
  scoreLink(link, keywords = []) {
    if (!link || !link.url) return 0;

    let score = 0;
    const combined = `${link.text} ${link.url}`.toLowerCase();

    // Keyword matches
    for (const kw of keywords) {
      if (combined.includes(kw)) {
        score += 0.25;
      }
    }

    // High intent path bonuses
    if (/\b(doc|docs|documentation|specification|specs|price|pricing|about|detail|release)\b/i.test(combined)) {
      score += 0.3;
    }

    // Negative penalties
    if (/\b(login|signup|privacy|terms|cookie|cart|checkout)\b/i.test(combined)) {
      score -= 0.5;
    }

    return Math.max(0, Math.min(1.0, score));
  }

  /**
   * Navigates a site starting from an initial URL or page content.
   * @param {object} startPage { url, html }
   * @param {object} plan Query plan from QueryPlanner
   * @returns {object} Traversal result with visited pages and extracted semantic texts
   */
  async explore(startPage, plan) {
    const queue = [{ url: startPage.url, depth: 0, html: startPage.html }];
    const pages = [];

    while (queue.length > 0 && pages.length < this.maxVisited) {
      const current = queue.shift();

      if (this.visitedUrls.has(current.url)) continue;
      this.visitedUrls.add(current.url);

      let rawHtml = current.html;
      if (!rawHtml && this.fetcher) {
        try {
          rawHtml = await this.fetcher(current.url);
        } catch (err) {
          this.history.push({ url: current.url, error: err.message, status: 'FAILED' });
          continue;
        }
      }

      if (!rawHtml) continue;

      const pruned = DomPruner.prune(rawHtml, current.url);
      pages.push({
        url: current.url,
        depth: current.depth,
        pruned,
        timestamp: new Date().toISOString()
      });

      this.history.push({
        url: current.url,
        depth: current.depth,
        prunedLength: pruned.prunedSize,
        tokenEstimate: pruned.tokenEstimate,
        status: 'SUCCESS'
      });

      // If maximum depth reached, don't enqueue child links
      if (current.depth >= this.maxDepth) continue;

      // Rank discovered candidate links
      const scoredLinks = pruned.links
        .filter((l) => !this.visitedUrls.has(l.url))
        .map((l) => ({ ...l, score: this.scoreLink(l, plan.keywords) }))
        .filter((l) => l.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, plan.maxPagesPerHop || 3);

      for (const link of scoredLinks) {
        queue.push({
          url: link.url,
          depth: current.depth + 1,
          html: null
        });
      }
    }

    return {
      pages,
      history: this.history,
      totalVisited: pages.length
    };
  }
}
