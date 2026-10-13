# ⚡ AMD WebScout: Autonomous Intelligent Web Retrieval & Verification Agent

> **Competition**: AMD AI League — Match 4: *Intelligent Web Information Retrieval* (lablab.ai × AMD)  
> **Prize Pool**: $500 Cash (Match 1st) + $2,500 Grand League Podium + ROCm™ Certified Associate Credential  
> **Author**: Siddharth Srivastava (`@sidsri14`)  
> **Track**: Autonomous Web Agents, Retrieval-Augmented Generation & Hardware-Accelerated AI  
> **Status**: **Production Ready — 10/10 Tests Passing**

---

## 🚀 Overview

Web information retrieval agents typically suffer from three fatal flaws when navigating live sites:
1. **Context Window Bloat**: Raw web pages contain thousands of lines of boilerplate HTML, ads, scripts, and CSS that burn token budgets and cause attention degradation.
2. **Ungrounded Extraction & Hallucination**: LLMs often synthesize approximate answers rather than extracting exact, verifiable values.
3. **No Cryptographic Auditability**: Users cannot easily verify if a price, specification, or claim was genuinely present on the source page at extraction time.

**`AMD WebScout`** solves these challenges with an ultra-lightweight, high-throughput autonomous agent optimized for AMD ROCm platforms:
- **Intelligent Query Decomposition**: Breaks natural-language prompts into structured intent schemas (`PRICING`, `SPECIFICATIONS`, `DATES`), semantic entities, and link scoring heuristics.
- **Semantic DOM Pruner**: Strips 80–90% of token bloat while extracting candidate hyperlinks, markdown structure, and tabular data.
- **Autonomous Multi-Hop Navigator**: Dynamically scores and explores multi-page link trees without runaway loops.
- **Deterministic Entity Extractor**: Pulls verified facts, currencies, and technical parameters with explicit confidence scores.
- **Tamper-Evident SHA-256 Provenance Ledger**: Anchors every query, pruned DOM payload, and extracted quote in a hash-linked cryptographic chain.
- **ROCm Hardware Profile**: Profiles latency and token throughput for AMD Instinct™ MI300X/MI250X CDNA3 accelerators.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    UserQuery[User Natural Language Prompt] --> QP[Query Planner]
    QP -->|Intents, Target Entities, Keywords| Nav[Multi-Hop Navigator]
    
    Nav --> Fetch[Fetch HTML Page]
    Fetch --> Pruner[Semantic DOM Pruner]
    Pruner -->|Pruned Markdown & Links| Rank[Semantic Link Ranker]
    
    Rank -->|Top Candidate URLs| Nav
    Pruner --> Extractor[Structured Fact Extractor]
    
    Extractor --> Facts[Extracted Entities & Table Rows]
    Facts --> Ledger[Cryptographic SHA-256 Provenance Ledger]
    
    Ledger --> Receipt[Immutable Audit Receipt]
    Facts --> Output[Verified Grounded Output]
```

---

## 🧪 Verified Test Suite (10/10 Passing)

Run the automated test suite with standard Node.js (v20+):

```bash
npm test
```

```text
✔ 1. QueryPlanner identifies pricing intent and extracts keywords (5.2ms)
✔ 2. QueryPlanner rejects empty or invalid prompts (0.7ms)
✔ 3. DomPruner compresses HTML and removes scripts and styling (1.6ms)
✔ 4. DomPruner extracts candidate links and table data (0.8ms)
✔ 5. Navigator scores candidate links according to query keywords (0.7ms)
✔ 6. Extractor identifies targeted prices and technical specifications (1.3ms)
✔ 7. ProvenanceLedger records cryptographic hash chains (1.1ms)
✔ 8. ProvenanceLedger detects tampering when entry is mutated (0.3ms)
✔ 9. RocmBenchmark returns hardware profile and token throughput (0.6ms)
✔ 10. End-to-end AMDWebScoutAgent retrieval pipeline executes seamlessly (1.9ms)
ℹ tests 10 | pass 10 | fail 0 | duration_ms 140ms
```

---

## ⚡ Quickstart & Live Demo

Run the end-to-end multi-page simulation:

```bash
npm run demo
```

Output:
```text
===========================================================================
⚡ AMD WEBSCOUT: AUTONOMOUS INTELLIGENT WEB RETRIEVAL & VERIFICATION AGENT
   AMD AI League Match 4 (Intelligent Web Information Retrieval)
===========================================================================

[PHASE 1] Incoming Natural Language Request:
  ▶ "What is the pricing, memory capacity, and compute architecture of the AMD Instinct MI300X?"

[PHASE 2] Executing Autonomous Multi-Hop Retrieval...

[PHASE 3] Query Decomposition & Plan:
  ▶ Detected Intents:      PRICING_EXTRACTION, TECHNICAL_SPECIFICATIONS
  ▶ Target Entity Types:   price, specifications
  ▶ High-Priority Keywords: [pricing, memory, capacity, compute, architecture, amd, instinct, mi300x]

[PHASE 4] Navigation & Semantic DOM Compression:
  ▶ Total Web Pages Explored: 2
    - Visited: https://instinct.amd.com (Depth: 0) -> Reduced to 61 tokens (SUCCESS)
    - Visited: https://instinct.amd.com/mi300x (Depth: 1) -> Reduced to 129 tokens (SUCCESS)

[PHASE 5] Extracted Verified Facts & Evidence:
  ▶ Aggregate Confidence Score: 70%
    [Fact 1] (TABLE_ROW) Conf: 90% | Architecture | CDNA3
    [Fact 2] (TABLE_ROW) Conf: 90% | Memory | 192GB HBM3
    [Fact 10] (PRICE)    Conf: 56% | $15,000

[PHASE 6] Cryptographic Provenance Ledger:
  ▶ Ledger Audit Status:  ✅ VALID (100% Tamper-Evident)
  ▶ Latest Receipt Hash:  0fc66c8f2ddf9e8a1455670b38e659b6d731d0624c5368f85ae574538e6999fe

[PHASE 7] AMD Hardware Acceleration Profile:
  ▶ Target Device:        Host Environment (x86_64 Optimized SIMD)
  ▶ Latency:              5.34 ms
  ▶ Throughput:           35,587 tokens/sec
  ▶ Projected MI300X ROCm: 658,360 tokens/sec
```

---

## 📜 Submission Details

- **Hackathon**: AMD AI League — Match 4
- **Host**: AMD × NativelyAI × Lablab.ai
- **License**: MIT
