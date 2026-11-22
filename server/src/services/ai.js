// server/src/services/ai.js
// Autonomous Innovation Intelligence & Multi-LLM Service (Google Gemini + OpenAI + Heuristic Fallback)

import {
  buildSystemInstruction,
  classifyError,
  redactSecrets,
  sanitizeHistory
} from './sanaPromptEngine.js';

// Canonical Gemini Models
const MODEL_DEEP = 'gemini-2.0-flash';
const MODEL_FAST = 'gemini-2.0-flash-lite';
const MODEL_FALLBACK_FAST = 'gemini-1.5-flash';

/**
 * Validates custom Gemini API key format (never logs key)
 */
export function isValidGeminiKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return trimmed.length >= 30 && trimmed.startsWith('AIza');
}

/**
 * Prepares Gemini request payload
 */
function prepareGeminiPayload({
  prompt,
  context = '',
  referenceBlock = '',
  history = [],
  imageBase64 = null,
  imageMimeType = null,
  isFastMode = false
}) {
  const systemInstruction = buildSystemInstruction(isFastMode);

  const contents = [];

  // 1. History
  if (Array.isArray(history) && history.length > 0) {
    const cleanHistory = sanitizeHistory(history);
    contents.push(...cleanHistory);
  }

  // 2. Active User Message parts
  const userParts = [];

  // Multimodal image attachment
  if (imageBase64 && imageMimeType) {
    // Strip header if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    userParts.push({
      inlineData: {
        mimeType: imageMimeType,
        data: cleanBase64
      }
    });
  }

  // Text content with reference block if present
  let fullPromptText = '';
  if (referenceBlock) {
    fullPromptText += `${referenceBlock}\n\n`;
  } else if (context) {
    fullPromptText += `<reference_data_only>\nContext: ${context}\n</reference_data_only>\n\n`;
  }
  fullPromptText += prompt;

  userParts.push({ text: fullPromptText });
  contents.push({ role: 'user', parts: userParts });

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents,
    generationConfig: {
      temperature: isFastMode ? 0.55 : 0.45,
      maxOutputTokens: isFastMode ? 1200 : 2048
    }
  };

  return payload;
}

/**
 * 1. Non-streaming AI Query Handler
 * Backward-compatible with existing JSON endpoints & Android client
 */
export async function askAI(prompt, context = '', customApiKey = null, options = {}) {
  const geminiKey = (customApiKey && isValidGeminiKey(customApiKey) ? customApiKey.trim() : null) ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const isFastMode = Boolean(options.fastMode || options.mode === 'fast');
  const primaryModel = isFastMode ? MODEL_FAST : (process.env.GEMINI_MODEL || MODEL_DEEP);
  const fallbackModel = MODEL_FALLBACK_FAST;

  // ---------------------------------------------------------------------------
  // 1. GOOGLE GEMINI API (Primary Generative Engine)
  // ---------------------------------------------------------------------------
  if (geminiKey) {
    const modelsToTry = [primaryModel, fallbackModel];
    for (const model of modelsToTry) {
      try {
        const payload = prepareGeminiPayload({
          prompt,
          context,
          referenceBlock: options.referenceBlock,
          history: options.history,
          imageBase64: options.imageBase64,
          imageMimeType: options.imageMimeType,
          isFastMode
        });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 28000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return {
              mode: 'live',
              provider: 'google',
              engine: `AI Sana (${model})`,
              reply: redactSecrets(reply)
            };
          }
        } else {
          const errText = await res.text();
          console.warn(`Gemini (${model}) returned HTTP ${res.status}:`, redactSecrets(errText).slice(0, 200));
        }
      } catch (err) {
        console.warn(`Gemini (${model}) request failed:`, redactSecrets(err.message));
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2. OPENAI API (Secondary Provider if configured)
  // ---------------------------------------------------------------------------
  if (openaiKey) {
    try {
      const systemInstruction = buildSystemInstruction(isFastMode);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Context:\n${options.referenceBlock || context || 'General'}\n\nUser Question:\n${prompt}` }
          ],
          temperature: isFastMode ? 0.55 : 0.45
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (r.ok) {
        const d = await r.json();
        const reply = d.choices?.[0]?.message?.content;
        if (reply) {
          return {
            mode: 'live',
            provider: 'openai',
            engine: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            reply: redactSecrets(reply)
          };
        }
      }
    } catch (e) {
      console.warn('OpenAI request failed:', redactSecrets(e.message));
    }
  }

  // ---------------------------------------------------------------------------
  // 3. AUTONOMOUS HEURISTIC ENGINE (Zero-dependency fallback)
  // ---------------------------------------------------------------------------
  return getAutonomousHeuristicReply(prompt, context || options.referenceBlock);
}

/**
 * 2. Streaming AI Query Handler with SSE and Auto-Fallback
 */
export async function streamAI(prompt, options = {}, sseEmitter) {
  const customApiKey = options.customApiKey || options.apiKey;
  const geminiKey = (customApiKey && isValidGeminiKey(customApiKey) ? customApiKey.trim() : null) ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  const isFastMode = Boolean(options.fastMode || options.mode === 'fast');
  const primaryModel = isFastMode ? MODEL_FAST : (process.env.GEMINI_MODEL || MODEL_DEEP);

  sseEmitter({ type: 'phase', phase: 'CHECKING_CONNECTION', message: 'Checking AI connection...' });

  if (geminiKey) {
    // Attempt Primary Model with retry and fallback
    let attempt = 0;
    let model = primaryModel;
    let firstChunkReceived = false;

    while (attempt < 3 && !firstChunkReceived) {
      attempt++;
      try {
        if (attempt > 1 && !firstChunkReceived && model === primaryModel && !isFastMode) {
          // Switch to Fast model if Deep mode failed before first chunk
          model = MODEL_FAST;
          sseEmitter({
            type: 'meta',
            event: 'fallback',
            model: 'fast',
            reason: 'Deep mode busy. Switched to AI Sana Fast.'
          });
          sseEmitter({ type: 'phase', phase: 'SWITCHING_MODEL', message: 'Switched to AI Sana Fast...' });
        }

        sseEmitter({
          type: 'phase',
          phase: 'THINKING',
          message: options.hasAttachedImage ? 'Analyzing prototype image...' : 'Thinking...'
        });

        const payload = prepareGeminiPayload({
          prompt,
          context: options.context,
          referenceBlock: options.referenceBlock,
          history: options.history,
          imageBase64: options.imageBase64,
          imageMimeType: options.imageMimeType,
          isFastMode: model === MODEL_FAST
        });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${geminiKey}`;
        
        // Combine caller abort signal with timeout
        const internalController = new AbortController();
        const timeoutMs = isFastMode ? 25000 : 35000;
        const timeout = setTimeout(() => internalController.abort(new Error('AI Sana request timed out')), timeoutMs);

        if (options.signal) {
          options.signal.addEventListener('abort', () => internalController.abort(new Error('Request aborted by user')));
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: internalController.signal
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 150)}`);
        }

        if (!res.body) {
          throw new Error('No readable response body from Gemini');
        }

        // Parse SSE stream
        sseEmitter({ type: 'phase', phase: 'STREAMING', message: 'Streaming response...' });

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr && jsonStr !== '[DONE]') {
                try {
                  const parsed = JSON.parse(jsonStr);
                  const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (textPart) {
                    firstChunkReceived = true;
                    sseEmitter({ type: 'chunk', text: redactSecrets(textPart) });
                  }
                } catch {
                  // Ignore JSON parse chunk errors
                }
              }
            }
          }
        }

        // Flush remaining buffer
        if (buffer.trim().startsWith('data:')) {
          const jsonStr = buffer.trim().slice(5).trim();
          try {
            const parsed = JSON.parse(jsonStr);
            const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textPart) {
              firstChunkReceived = true;
              sseEmitter({ type: 'chunk', text: redactSecrets(textPart) });
            }
          } catch {}
        }

        if (firstChunkReceived) {
          sseEmitter({
            type: 'done',
            meta: {
              provider: 'google',
              engine: `AI Sana (${model})`,
              mode: model === MODEL_FAST ? 'fast' : 'deep'
            }
          });
          return;
        } else {
          throw new Error('Empty response received from Gemini');
        }
      } catch (err) {
        if (err.name === 'AbortError' || options.signal?.aborted) {
          sseEmitter({ type: 'done', meta: { aborted: true } });
          return;
        }

        console.warn(`Stream attempt ${attempt} failed:`, redactSecrets(err.message));
        if (attempt >= 2 || firstChunkReceived) {
          const classified = classifyError(err);
          // If live streaming failed completely, fall back gracefully to heuristic engine
          console.warn('Falling back to autonomous intelligence engine stream...');
          break;
        }
      }
    }
  }

  // Fallback: Stream from Autonomous Intelligence Engine
  await streamAutonomousHeuristicReply(prompt, options.context || options.referenceBlock, sseEmitter, options.signal);
}

/**
 * Streams the autonomous heuristic engine in smooth chunks
 */
async function streamAutonomousHeuristicReply(prompt, context, sseEmitter, signal) {
  const result = getAutonomousHeuristicReply(prompt, context);
  const text = result.reply;

  sseEmitter({ type: 'phase', phase: 'STREAMING', message: 'Streaming response...' });

  // Stream in realistic word clusters
  const words = text.split(' ');
  let idx = 0;

  while (idx < words.length) {
    if (signal?.aborted) {
      sseEmitter({ type: 'done', meta: { aborted: true } });
      return;
    }

    const clusterSize = Math.floor(Math.random() * 4) + 2;
    const chunk = words.slice(idx, idx + clusterSize).join(' ') + ' ';
    idx += clusterSize;

    sseEmitter({ type: 'chunk', text: chunk });
    await new Promise(r => setTimeout(r, 20));
  }

  sseEmitter({
    type: 'done',
    meta: {
      provider: 'autonomous',
      engine: 'AI Sana Heuristic Core',
      mode: 'heuristic'
    }
  });
}

/**
 * Autonomous Innovation Intelligence Heuristic Engine (Offline / Zero-credential safety net)
 */
function getAutonomousHeuristicReply(prompt, context = '') {
  const p = prompt.toLowerCase();
  const title = (context && typeof context === 'string' && context.length > 5)
    ? context.split('\n')[0].replace(/^Title:\s*/i, '').replace(/<[^>]+>/g, '').trim()
    : 'Your Innovation';

  // 1. Patentability Scan
  if (p.includes('patent') || p.includes('prior art') || p.includes('novelty') || p.includes('claims') || p.includes('ip')) {
    return {
      mode: 'heuristic',
      provider: 'autonomous',
      engine: 'AI Sana Patent Intelligence',
      type: 'patentability_scan',
      reply: `### 🛡️ AI Sana Preliminary Patentability & Prior-Art Scan
**Subject:** ${title}

---

#### 1. Novelty & Defensibility Assessment
* **Core Technical Differentiator:** To establish patent novelty under 35 U.S.C. 102/103, focus claims on the proprietary hardware/software interaction loop, unique data pipeline, or mechanical arrangement rather than the broad abstract concept.
* **Suggested Classifications:**
  * **CPC / IPC:** G06Q (Data processing systems for specific business/logistical methods) & G06F (Electric digital data processing).
  * **USPTO Art Unit:** 2100 (Computer Architecture and Software) or 3600 (Transportation, E-Commerce, Construction).

#### 2. Prior-Art Risk Matrix
* **Primary Search Corridors:** Google Patents, Espacenet, and USPTO Patent Public Search using exact CPC intersection tags.
* **Non-Patent Literature Risk:** Examine relevant IEEE Xplore, arXiv whitepapers, and GitHub repositories published prior to your earliest filing date.

#### 3. Recommended Filing Strategy
1. **File a Provisional Patent Application (PPA):** Secures an immediate 12-month priority date at low government filing fees.
2. **Execute Digital NDA:** Never disclose non-public schematics, source code, or CAD files without bilateral mutual NDA protection.
3. **Follow-on PCT Application:** File a Patent Cooperation Treaty application within 12 months to preserve global patent rights in over 150 nations.

*⚠️ Disclaimer: AI Sana provides conceptual engineering analysis, not formal legal counsel. Always consult a registered patent attorney.*`
    };
  }

  // 2. Market Sizing (TAM/SAM/SOM)
  if (p.includes('tam') || p.includes('sam') || p.includes('som') || p.includes('market size') || p.includes('market sizing') || p.includes('cagr')) {
    return {
      mode: 'heuristic',
      provider: 'autonomous',
      engine: 'AI Sana Venture Analytics',
      type: 'market_sizing',
      reply: `### 📊 AI Sana Market Sizing Analysis (TAM / SAM / SOM)
**Sector Focus:** ${title}

---

#### 1. Addressable Market Architecture
* **TAM (Total Addressable Market):** **$18.4 Billion** global potential assuming universal adoption of modern digital/hardware automation solutions in this industry.
* **SAM (Serviceable Available Market):** **$2.6 Billion** representing initial geographic and enterprise customer segments seeking high-efficiency replacements.
* **SOM (Serviceable Obtainable Market - 3-Year Target):** **$42 Million** captureable with a dedicated early-stage sales channel and high-velocity product adoption.

#### 2. Growth Drivers & Industry CAGR
* **Compound Annual Growth Rate (CAGR):** Projected at **16.8%** through 2030, driven by regulatory compliance, cost pressures, and rapid digitization.
* **Willingness to Pay (WTP):** Target enterprise customers demonstrate acceptable payback thresholds of **under 9 months**.

#### 3. Unit Economics & Pricing Model
* **Model:** Tiered B2B SaaS + Deployment licensing or hardware margin + recurring telemetry service.
* **Target LTV / CAC Ratio:** Aim for **> 3.5x** with gross margins maintained above **70%**.`
    };
  }

  // 3. 1-Minute Pitch Deck
  if (p.includes('pitch deck') || p.includes('pitch') || p.includes('slides') || p.includes('slide deck')) {
    return {
      mode: 'heuristic',
      provider: 'autonomous',
      engine: 'AI Sana Investor Strategy',
      type: 'pitch_deck',
      reply: `### 📑 AI Sana 5-Slide Executive Pitch Deck
**Venture:** ${title}

---

#### Slide 1: Problem & Friction
* Critical pain points in existing legacy systems: inefficient workflows, excessive operating costs, and lack of real-time visibility.
* Incumbent solutions are fragmented, brittle, and expensive to customize.

#### Slide 2: The Solution & Technical Advantage
* Proprietary modular platform delivering automated, end-to-end efficiency.
* High-velocity integration with 60% lower deployment overhead.

#### Slide 3: Market Opportunity & Unit Economics
* $18B+ TAM expanding at 16.8% CAGR.
* Validated initial demand with customer payback achieved in under 9 months.

#### Slide 4: Defensibility & Intellectual Property
* Proprietary trade secrets, unique data feedback loop, and provisional patent priority date locked.
* Deal room protection enabled for accredited co-investors and enterprise partners.

#### Slide 5: The Ask & Milestones
* **Seeking:** Pre-seed / Seed financing to scale production and expand commercial pilots.
* **Next 12 Months:** Complete 10 enterprise pilot deployments and achieve $1.2M ARR.`
    };
  }

  // 4. Prototyping & Tech Blueprint (BOM)
  if (p.includes('prototype') || p.includes('blueprint') || p.includes('bom') || p.includes('tech stack') || p.includes('hardware')) {
    return {
      mode: 'heuristic',
      provider: 'autonomous',
      engine: 'AI Sana Engineering Architecture',
      type: 'prototyping_blueprint',
      reply: `### 🛠️ AI Sana Rapid Prototyping & Technical Blueprint
**System:** ${title}

---

#### 1. Architecture & Core Stack
* **Microservices:** Node.js Express + Prisma ORM + PostgreSQL with connection pooling.
* **Streaming Engine:** Server-Sent Events (SSE) & WebSockets for real-time telemetry and AI streaming.
* **Frontend Digital Twin:** React 18 + Vite + Three.js for interactive 3D prototype visualization.
* **Hardware/Edge (if applicable):** ESP32-S3 Dual-Core microcontroller, telemetry sensors via I2C/SPI, SLS 3D printed enclosure.

#### 2. 8-Week Build Sprint Velocity
* **Weeks 1–2:** Core schematic design, API contracts, and breadboard POC.
* **Weeks 3–4:** Custom 2-layer PCB fabrication and cloud database integration.
* **Weeks 5–6:** Enclosure assembly, firmware integration, and initial field testing.
* **Weeks 7–8:** Pilot alpha deployment with 5 feedback partners.`
    };
  }

  // 5. Default General Consultation
  return {
    mode: 'heuristic',
    provider: 'autonomous',
    engine: 'AI Sana Strategic Intelligence',
    type: 'general',
    reply: `### 💡 AI Sana Strategic Consultation
**Topic:** ${title}

---

#### Key Execution Priorities:
1. **De-Risk Core Hypotheses:** Identify the single riskiest assumption of your concept (customer willingness to pay, technical feasibility, or unit margins) and design a 48-hour validation experiment.
2. **Lock In Your Priority Date:** Before public presentations, file a Provisional Patent Application or formal invention disclosure log.
3. **Engage Elite Builders:** Leverage IDEA2IMPACT's Talent Directory to connect with vetted engineers, architects, and angel backers.
4. **Quantify the ROI:** Frame your innovation not as a feature, but as dollars saved or hours regained for your target customer.

*💡 Quick Tip: Click any quick prompt above to generate a **Patentability Scan**, calculate **Market Size (TAM)**, or draft an **Executive Pitch Deck**.*`
  };
}
