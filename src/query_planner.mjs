/**
 * AMD WebScout: Intelligent Query Planner
 * Decomposes natural language retrieval requests into actionable search plans,
 * target entity schemas, and scoring heuristics.
 */

export class QueryPlanner {
  /**
   * Plans an information retrieval mission from a natural language prompt.
   * @param {string} prompt
   * @returns {object} Structured retrieval mission plan
   */
  static plan(prompt) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('QueryPlanner: Prompt must be a non-empty string');
    }

    const cleanPrompt = prompt.trim();
    const lower = cleanPrompt.toLowerCase();

    // Identify target entities and intent
    const intents = [];
    const targetEntities = [];

    if (/\b(price|cost|fee|pricing|rate|\$|usd|eur)\b/i.test(lower)) {
      intents.push('PRICING_EXTRACTION');
      targetEntities.push('price');
    }
    if (/\b(spec|specs|specifications|dimensions|architecture|vram|tflops|bandwidth)\b/i.test(lower)) {
      intents.push('TECHNICAL_SPECIFICATIONS');
      targetEntities.push('specifications');
    }
    if (/\b(date|release|deadline|schedule|timeline|time)\b/i.test(lower)) {
      intents.push('TEMPORAL_INFORMATION');
      targetEntities.push('date');
    }
    if (/\b(contact|email|founder|author|ceo|team|maintainer)\b/i.test(lower)) {
      intents.push('PERSONNEL_LOOKUP');
      targetEntities.push('personnel');
    }
    if (/\b(compare|versus|vs|difference|benchmark)\b/i.test(lower)) {
      intents.push('COMPARATIVE_ANALYSIS');
      targetEntities.push('comparison');
    }

    // Default intent if general inquiry
    if (intents.length === 0) {
      intents.push('FACTUAL_RETRIEVAL');
      targetEntities.push('summary');
    }

    // Extract key search terms by removing common stop words
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
      'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'from', 'up', 'down', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should',
      'would', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'find',
      'retrieve', 'search', 'get', 'give', 'tell', 'show', 'please'
    ]);

    const tokens = lower
      .replace(/[^a-z0-9_\-\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !stopWords.has(t));

    const keywords = Array.from(new Set(tokens));

    return {
      query: cleanPrompt,
      intents,
      targetEntities,
      keywords,
      maxHops: 3,
      maxPagesPerHop: 5,
      confidenceThreshold: 0.75,
      timestamp: new Date().toISOString()
    };
  }
}
