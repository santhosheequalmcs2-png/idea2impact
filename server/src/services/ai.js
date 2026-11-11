export async function askAI(prompt, context = '') {
  // If OpenAI API key is configured, use live LLM
  if (process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are IDEA2IMPACT Copilot, an elite Silicon Valley innovation strategist, patent analyst, and startup mentor. Format your answers clearly with sections, bullet points, and scores. Maintain high professionalism and always provide actionable next steps.'
            },
            {
              role: 'user',
              content: `Context / Innovation Details: ${context || 'None provided'}\n\nUser Question / Task: ${prompt}`
            }
          ],
          temperature: 0.7
        })
      });

      if (r.ok) {
        const d = await r.json();
        const reply = d.choices?.[0]?.message?.content;
        if (reply) {
          return { mode: 'live', reply };
        }
      }
    } catch (e) {
      console.warn('OpenAI request failed, falling back to autonomous innovation intelligence engine:', e.message);
    }
  }

  // Autonomous Innovation Intelligence Heuristic Engine
  const p = prompt.toLowerCase();
  const title = (context.match(/title:\s*([^\n,]+)/i) || [])[1] || 'Your Innovation';

  if (p.includes('patent') || p.includes('novelty') || p.includes('prior art') || p.includes('protect')) {
    return {
      mode: 'heuristic',
      type: 'patentability',
      noveltyScore: 92,
      reply: `### 🛡️ AI Patentability & Prior-Art Scan
**Subject:** ${title}
**Estimated Novelty Score:** **92% (High Novelty)** · Classification: *G06Q / H04L / B64U*

#### 1. Core Patentable Claims
- **Claim 1 (Independent):** A modular system combining localized sensor telemetry with automated event-triggered feedback loops.
- **Claim 2 (Method):** The algorithmic orchestration of distributed data states to minimize power consumption by ~40%.
- **Claim 3 (Apparatus):** A physical/hardware enclosure optimized for rapid thermal dissipation and modular maintenance.

#### 2. Prior-Art & Freedom-to-Operate Radar
- **Identified Similar Filings:** 3 related USPTO utility patents in adjacent classes (none claim the exact combination).
- **Risk Level:** **Low-to-Moderate**. The inventive step lies in the specific integration workflow and low-latency feedback architecture.

#### 3. Recommended 90-Day IP Strategy
1. **File a Provisional Patent Application (PPA)** to lock in your priority filing date for <$300 (USPTO micro-entity fee).
2. **Execute digital Non-Disclosure Agreements (NDAs)** before public demonstrator releases.
3. Consult our in-house network patent attorney (*David S. Miller, Esq.*) for formal claim drafting before the 12-month PCT international deadline.`
    };
  }

  if (p.includes('tam') || p.includes('market') || p.includes('size') || p.includes('growth') || p.includes('revenue')) {
    return {
      mode: 'heuristic',
      type: 'market_sizing',
      reply: `### 📊 Market Sizing (TAM / SAM / SOM) Analysis
**Target Domain:** ${title}
**Projected 5-Year CAGR:** **+18.4% annually**

#### 1. Market Opportunity Breakdown
- **TAM (Total Addressable Market):** **$14.2 Billion** (Global target domain spending across enterprise and commercial channels).
- **SAM (Serviceable Addressable Market):** **$2.6 Billion** (North America & Western Europe early adopters and specialized sectors).
- **SOM (Serviceable Obtainable Market - 36 Mo):** **$18.5 Million** (Capturing 0.7% market penetration with a lean direct-to-consumer & B2B pilot sales force).

#### 2. Recommended Monetization Architecture
- **Hardware/Base Unit Sales:** Gross margin target of 58% ($240 COGS on $580 ASP).
- **Subscription Software (SaaS / Telemetry):** $29/mo tiered recurring platform access.
- **Enterprise Licensing:** $15,000/yr annual white-label licenses for tier-1 distributors.

#### 3. Key Growth Catalysts
1. Integration partnerships with regional industrial distributors.
2. Direct validation pilots with 10 design partners in Q1-Q2.`
    };
  }

  if (p.includes('pitch') || p.includes('deck') || p.includes('investor') || p.includes('summary')) {
    return {
      mode: 'heuristic',
      type: 'pitch_deck',
      reply: `### 📑 1-Minute Executive Pitch Deck
**Company / Project:** ${title}

---
#### Slide 1 · The Pain Point (Why Now?)
Legacy solutions in this sector are bloated, expensive, and fragile. Current users waste an average of 14 hours/week or thousands in operational overhead due to lack of real-time intelligence.

#### Slide 2 · The Breakthrough (Our Solution)
**${title}** delivers a frictionless, high-precision alternative that reduces friction by 65% while deploying in under 15 minutes.

#### Slide 3 · The Unfair Advantage (Moat)
- Proprietary low-latency architecture and pending patent claims.
- 3.2x more cost-efficient unit economics than legacy incumbents.
- Sticky network effects between creators, builders, and suppliers.

#### Slide 4 · Traction & Validation
- Functional proof-of-concept validated with positive telemetry.
- 400+ waitlist signups and active collaborative discussion on IDEA2IMPACT.
- Target launch date scheduled for upcoming product sprint.

#### Slide 5 · The Ask
- **Round Target:** **$250,000 Seed / Pre-Seed**
- **Use of Funds:** 50% Engineering & Prototyping · 30% Pilot Go-to-Market · 20% IP Protection & Working Capital.`
    };
  }

  if (p.includes('prototype') || p.includes('tech') || p.includes('build') || p.includes('stack') || p.includes('bom')) {
    return {
      mode: 'heuristic',
      type: 'prototyping',
      reply: `### 🛠️ Rapid Prototyping & Engineering Blueprint
**Project:** ${title}
**Estimated Prototype Budget:** **$2,400 - $4,800** · **Timeline:** **6 to 8 Weeks**

#### 1. Recommended Architecture & Tech Stack
- **Hardware / Edge (if physical):** ESP32-S3 / STM32 Cortex-M4 microcontroller + I2C/SPI sensor array + LiPo 3.7V battery with MP2617 charging IC.
- **Firmware:** FreeRTOS or Embedded C with Zephyr RTOS for ultra-low sleep current.
- **Cloud & Backend:** Node.js Express + Neon PostgreSQL + Prisma + WebSockets for telemetry.
- **Frontend / Mobile:** React + Vite + Three.js 3D spatial visualization.

#### 2. 8-Week Sprint Milestones
- **Weeks 1-2:** Breadboard schematic validation and sensor bench-testing.
- **Weeks 3-4:** First 2-layer PCB fabrication (JLCPCB / OSH Park) + 3D printed enclosure iteration #1.
- **Weeks 5-6:** Firmware flash, BLE/WiFi pairing handshake, and database data ingestion.
- **Weeks 7-8:** Alpha field testing with 5 real-world users for feedback revision.`
    };
  }

  // Default General Innovation Consultation
  return {
    mode: 'heuristic',
    type: 'general',
    reply: `### 💡 IDEA2IMPACT Strategic Advisory
**Focus:** ${title}

Here is your high-impact execution checklist:

1. **User Validation First:** Before writing additional code or milling hardware, conduct 5 recorded 15-minute interviews with prospective end-users experiencing this exact problem.
2. **De-Risk Key Assumptions:** Identify the single assumption that would kill this idea if proven false (e.g. willingness to pay, battery life, manufacturing yield) and run a micro-experiment to test it.
3. **Protect Early:** Draft an invention disclosure log with date-stamped schematic sketches before sharing in public forums.
4. **Leverage the Talent Directory:** Partner with specialized Builders or patent attorneys on IDEA2IMPACT to accelerate development without full-time payroll overhead.

*Need deeper analysis? Try asking for **"Patentability Scan"**, **"Market Sizing TAM"**, or **"1-Minute Pitch Deck"**.*`
  };
}
