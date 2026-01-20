/**
 * LM SCORE ENGINE (v0.8.1 compat / v0.9 adapter-safe / v1.2 weights)
 * Fonte da verdade do LM Score.
 *
 * Regras travadas:
 * - Score começa em 100
 * - Só penaliza
 * - Score mínimo 40
 * - Penalização máxima 60
 * - Sempre retorna razões educacionais
 *
 * v1.2 (arquitetura):
 * - Adiciona pesos configuráveis por bloco via weights.config.js
 * - Modo "legacy" permanece DEFAULT (não altera regressão)
 * - Modo "block-weighted" é opcional e auditável (debug)
 */

import { block1BodyComposition } from "./block1_bodyComposition.js";
import { block2Activity } from "./block2_activity.js";
import { block3Expectation } from "./block3_expectation.js";
import { LM_WEIGHTS_V12 } from "./weights.config.js";

export const LM_CORE_VERSION = "0.8.2";

/**
 * API pública do core
 * @param {object} input
 * @param {object} [options]
 * @param {"legacy"|"block-weighted"} [options.mode]
 */
export function calculateLMScore(input, options = {}) {
  const mode = options.mode || "legacy";

  // 1) Executa blocos isolados (ciência está nos blocos)
  const b1 = block1BodyComposition(input);
  const b2 = block2Activity(input);
  const b3 = block3Expectation(input, b1, b2);

  // 2) Penalizações
  const p1 = Number.isFinite(b1.penalty) ? b1.penalty : 0;
  const p2 = Number.isFinite(b2.penalty) ? b2.penalty : 0;
  const p3 = Number.isFinite(b3.penalty) ? b3.penalty : 0;

  const blocks = {
    body: b1,
    activity: b2,
    expectation: b3,
  };

  // LEGACY: soma simples (comportamento travado)
  const totalPenaltyLegacy = p1 + p2 + p3;

  // BLOCK-WEIGHTED: aplica pesos externos sem mexer nos blocos
  const totalPenaltyRaw =
    mode === "block-weighted"
      ? applyWeightsToPenalties(blocks)
      : totalPenaltyLegacy;

  // 3) Penalização total com teto (60) e piso do score (40)
  const totalPenalty = clamp(totalPenaltyRaw, 0, 60);
  const score = clamp(100 - totalPenalty, 40, 100);

  return {
    version: LM_CORE_VERSION,
    mode,
    weightsVersion: LM_WEIGHTS_V12?.version || "none",

    score,
    classification: classify(score),

    // Razões educacionais (flat)
    reasons: [
      ...normalizeReasons("body", b1.reasons),
      ...normalizeReasons("activity", b2.reasons),
      ...normalizeReasons("expectation", b3.reasons),
    ],

    // Debug por bloco + totais
    blocks: {
      ...blocks,
      totalPenalty,
      totalPenaltyLegacy,
    },
  };
}

function classify(score) {
  // Faixas travadas (lock)
  if (score >= 85) return "Baixo risco metabólico";
  if (score >= 65) return "Risco metabólico leve";
  if (score >= 45) return "Risco metabólico moderado";
  return "Alto risco metabólico";
}

function normalizeReasons(block, reasons) {
  if (!Array.isArray(reasons)) return [];

  return reasons
    .map((reason) => {
      if (typeof reason === "string") {
        return { code: null, text: reason, block };
      }

      if (reason && typeof reason === "object") {
        const text = typeof reason.text === "string" ? reason.text : String(reason.text ?? "");
        const code = typeof reason.code === "string" ? reason.code : null;
        const reasonBlock = typeof reason.block === "string" ? reason.block : block;
        return { code, text, block: reasonBlock };
      }

      return { code: null, text: String(reason), block };
    })
    .filter((reason) => reason.text);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Normaliza pesos do config para somar 1.0
 * - Se config estiver incompleta/zerada: fallback para pesos iguais
 */
function getNormalizedWeights(blockKeys) {
  const cfg = (LM_WEIGHTS_V12 && LM_WEIGHTS_V12.blocks) ? LM_WEIGHTS_V12.blocks : {};
  const weights = {};
  let sum = 0;

  for (const k of blockKeys) {
    const w = Number(cfg[k]);
    const v = Number.isFinite(w) && w > 0 ? w : 0;
    weights[k] = v;
    sum += v;
  }

  // fallback: pesos iguais
  if (sum <= 0) {
    const eq = 1 / blockKeys.length;
    for (const k of blockKeys) weights[k] = eq;
    return { weights, sum: 1 };
  }

  // normaliza para somar 1.0
  for (const k of blockKeys) weights[k] = weights[k] / sum;
  return { weights, sum: 1 };
}

/**
 * v1.2 — Agregação ponderada por penalidade (engine punitivo).
 *
 * Requisito importante:
 * - Pesos no config somam 1.0
 * - Para que "pesos iguais" reproduzam exatamente o LEGACY,
 *   multiplicamos por N (número de blocos).
 *
 * Ex:
 * - weights iguais = 1/3 cada
 * - total = 3 * (p1*(1/3) + p2*(1/3) + p3*(1/3)) = p1+p2+p3 (LEGACY)
 *
 * Isso permite calibrar pesos sem mudar ciência dos blocos.
 */
function applyWeightsToPenalties(blocks) {
  const keys = Object.keys(blocks);
  const { weights } = getNormalizedWeights(keys);

  const N = keys.length;
  let weightedSum = 0;

  for (const k of keys) {
    const b = blocks[k] || {};
    const penalty = Number.isFinite(b.penalty) ? b.penalty : 0;

    const w = weights[k];

    // Telemetria/QA: registra peso aplicado no bloco
    b.weightApplied = w;

    weightedSum += penalty * w;
  }

  return N * weightedSum;
}
