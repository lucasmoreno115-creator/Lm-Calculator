// ===============================
// LM SCORE ENGINE — v0.9
// ===============================
// Responsável por orquestrar blocos e consolidar o LM Score.
// - NÃO define ciência do bloco (isso pertence aos blocos).
// - Mantém compatibilidade com modo legacy (v0.7 lockado).

import { calculateBodyComposition } from "./block1_bodyComposition.js";
import { calculateActivity } from "./block2_activity.js";
import { calculateExpectation } from "./block3_expectation.js";

// -------------------------------
// Versionamento / modo
// -------------------------------
export const LM_CORE_VERSION = "0.9.0";

export const LM_SCORE_MODE = {
  LEGACY: "legacy",
  BLOCK_WEIGHTED: "block-weighted"
};

/**
 * API pública do core
 * @param {object} input
 * @param {object} [options]
 * @param {"legacy"|"block-weighted"} [options.mode]
 */
export function calculateLMScore(input, options = {}) {
  const mode = options.mode || LM_SCORE_MODE.LEGACY;

  // 1) Executa blocos (sempre) para debug/telemetria,
  // mas o modo decide se usa raw ou weighted no score final.
  const blocks = {
    bodyComposition: safeBlockRun("bodyComposition", () => calculateBodyComposition(input)),
    activity: safeBlockRun("activity", () => calculateActivity(input)),
    expectation: safeBlockRun("expectation", () => calculateExpectation(input))
  };

  // 2) Consolidação final
  let score;
  if (mode === LM_SCORE_MODE.BLOCK_WEIGHTED) {
    score = aggregateBlockWeighted(blocks);
  } else {
    score = aggregateLegacy(blocks);
  }

  score = clamp(round(score, 0), 0, 100);

  // 3) Classificação e razões (mantém compat com UI)
  const classification = classify(score);
  const reasons = buildReasons(blocks, mode);

  return {
    version: LM_CORE_VERSION,
    mode,
    score,
    classification,
    reasons,
    blocks // <- v0.9: detalhe completo por bloco (raw/weighted/conf/flags)
  };
}

// -------------------------------
// Blocos: execução segura
// -------------------------------
function safeBlockRun(blockName, fn) {
  try {
    const result = fn();

    // Contrato mínimo esperado:
    // rawScore: number
    // weightedScore: number (pode ser igual ao raw no início)
    // confidence: number (0..1)
    // flags: string[]
    if (!result || !Number.isFinite(result.rawScore)) {
      return {
        rawScore: 0,
        weightedScore: 0,
        confidence: 0,
        flags: [`${blockName}:invalid_result`]
      };
    }

    return {
      rawScore: Number(result.rawScore),
      weightedScore: Number.isFinite(result.weightedScore) ? Number(result.weightedScore) : Number(result.rawScore),
      confidence: Number.isFinite(result.confidence) ? clamp(Number(result.confidence), 0, 1) : 1,
      flags: Array.isArray(result.flags) ? result.flags : [],
      weightProfile: result.weightProfile || undefined,
      meta: result.meta || undefined
    };
  } catch (e) {
    return {
      rawScore: 0,
      weightedScore: 0,
      confidence: 0,
      flags: [`${blockName}:error`],
      meta: { message: String(e?.message || e) }
    };
  }
}

// -------------------------------
// Agregadores
// -------------------------------

/**
 * v0.9 block-weighted:
 * - Usa weightedScore de cada bloco
 * - Normaliza por soma dos pesos efetivos se necessário
 *
 * Aqui assumimos que cada bloco já retorna weightedScore na mesma escala (0..100).
 * Se sua escala for diferente, ajuste no bloco (preferível) ou aqui (último recurso).
 */
function aggregateBlockWeighted(blocks) {
  // Se cada bloco já aplica seu peso interno, aqui é apenas uma média ponderada "implícita".
  // Estratégia simples: média dos weightedScore com ajuste por confidence.
  const entries = Object.values(blocks);

  let numerator = 0;
  let denom = 0;

  for (const b of entries) {
    const conf = Number.isFinite(b.confidence) ? b.confidence : 1;
    numerator += b.weightedScore * conf;
    denom += conf;
  }

  if (denom <= 0) return 0;
  return numerator / denom;
}

/**
 * LEGACY (v0.7 lockado):
 * - Deve reproduzir EXATAMENTE o comportamento antigo.
 *
 * Como no seu repo atual a lógica antiga não apareceu nos arquivos,
 * eu deixo o hook aqui. Você só pluga o cálculo legacy real.
 *
 * Por padrão, uso "média simples dos rawScore" como placeholder.
 * TROQUE assim que colarmos o engine v0.7 real.
 */
function aggregateLegacy(blocks) {
  // ✅ TODO: substituir pelo cálculo original v0.7 (lockado)
  const entries = Object.values(blocks);
  const sum = entries.reduce((acc, b) => acc + b.rawScore, 0);
  const avg = entries.length ? sum / entries.length : 0;
  return avg;
}

// -------------------------------
// Classificação (exemplo)
// -------------------------------
function classify(score) {
  // Ajuste para exatamente o que você já usa hoje no v0.7.
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Moderado";
  return "Atenção";
}

// -------------------------------
// Razões (explicabilidade)
// -------------------------------
function buildReasons(blocks, mode) {
  const reasons = [];

  // Heurística leve (debug). Ideal: flags definidas pelos blocos.
  const entries = Object.entries(blocks);
  for (const [name, b] of entries) {
    const flags = Array.isArray(b.flags) ? b.flags : [];
    for (const f of flags) reasons.push(`[${name}] ${f}`);
  }

  // Se não houver flags, retorna vazio e a UI mostra default.
  return reasons;
}

// -------------------------------
// Utils
// -------------------------------
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round(n, decimals = 0) {
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}
