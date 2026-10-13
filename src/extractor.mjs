/**
 * AMD WebScout: Structured Fact Extractor
 * Extracts verified facts, entities, numbers, and statements from pruned pages,
 * providing strict provenance snippets and confidence metrics.
 */

export class Extractor {
  /**
   * Extracts targeted information matching the query plan from visited pages.
   * @param {object[]} pages Array of visited pages from Navigator
   * @param {object} plan Query plan from QueryPlanner
   * @returns {object} Extracted facts, confidence, and provenance pointers
   */
  static extract(pages, plan) {
    if (!pages || pages.length === 0) {
      return {
        success: false,
        facts: [],
        confidence: 0.0,
        summary: 'No accessible pages found to extract information.',
        citations: []
      };
    }

    const facts = [];
    const citations = [];
    const keywords = plan.keywords || [];

    for (const page of pages) {
      const text = page.pruned.text;
      const lines = text.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.length < 5) continue;

        // Calculate line relevance score based on keyword overlap
        const lineLower = line.toLowerCase();
        let matchCount = 0;
        for (const kw of keywords) {
          if (lineLower.includes(kw)) {
            matchCount++;
          }
        }

        if (matchCount > 0) {
          // Check for specific entity patterns
          let entityType = 'FACT';
          let extractedValue = null;

          // Price extraction pattern
          const priceMatch = line.match(/\$[\d,]+(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|credits)/i);
          if (priceMatch && plan.targetEntities.includes('price')) {
            entityType = 'PRICE';
            extractedValue = priceMatch[0];
          }

          // Technical spec pattern
          const specMatch = line.match(/\b\d+(?:\.\d+)?\s*(?:GB|TB|MB|GHz|MHz|TFLOPS|HBM3|W|Watts|nm|cores)\b/i);
          if (specMatch && plan.targetEntities.includes('specifications')) {
            entityType = 'SPECIFICATION';
            extractedValue = specMatch[0];
          }

          // Date pattern
          const dateMatch = line.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s+\d{4})?|\b202[4-9]-\d{2}-\d{2}\b/i);
          if (dateMatch && plan.targetEntities.includes('date')) {
            entityType = 'DATE';
            extractedValue = dateMatch[0];
          }

          const confidence = Math.min(1.0, 0.5 + (matchCount / Math.max(1, keywords.length)) * 0.5);

          facts.push({
            entityType,
            value: extractedValue || line,
            snippet: line,
            url: page.url,
            confidence: Number(confidence.toFixed(2)),
            depth: page.depth
          });

          citations.push({
            url: page.url,
            quote: line,
            confidence: Number(confidence.toFixed(2))
          });
        }
      }

      // Also parse structured tables for matching rows
      if (page.pruned.tables && page.pruned.tables.length > 0) {
        for (const table of page.pruned.tables) {
          for (const row of table) {
            const rowText = row.join(' | ');
            const rowLower = rowText.toLowerCase();
            const hasKeyword = keywords.some((kw) => rowLower.includes(kw));

            if (hasKeyword) {
              facts.push({
                entityType: 'TABLE_ROW',
                value: rowText,
                snippet: rowText,
                url: page.url,
                confidence: 0.90,
                depth: page.depth
              });
            }
          }
        }
      }
    }

    // Sort facts by confidence descending
    facts.sort((a, b) => b.confidence - a.confidence);

    // Compute aggregate confidence
    const topFacts = facts.slice(0, 10);
    const avgConfidence = topFacts.length > 0
      ? topFacts.reduce((sum, f) => sum + f.confidence, 0) / topFacts.length
      : 0.0;

    return {
      success: topFacts.length > 0,
      facts: topFacts,
      confidence: Number(avgConfidence.toFixed(2)),
      totalFactsFound: facts.length,
      citations: citations.slice(0, 5)
    };
  }
}
