/**
 * LM SCORE ENGINE (v0.8.1 compat / v0.9 adapter-safe)
 * Fonte da verdade do LM Score.
 *
 * Regras travadas:
 * - Score começa em 100
 * - Só penaliza
 * - Score mínimo 40
 * - Penalização máxima 60
 * - Sempre retorna razões educacionais
 */

import { block1BodyComposition } from "./block1_bodyComposition.js";
import { block2Activity } from "./block2_activity.js";
import { block3Expectation } from "./block3_expectation.js";
import { LM_WEIGHTS_V12 } from "./weights.config.js";

export const LM_CORE_VERSION = "0.8.1";

export function calculateLMScore(input) {
  // Executa blocos isolados
  const b1 = block1BodyComposition(input);
  const b2 = block2Activity(input);
  const b3 = block3Expectation(input, b1, b2);

  // Penalização total com teto (60) e piso do score (40)
  const totalPenalty = clamp(b1.penalty + b2.penalty + b3.penalty, 0, 60);
  const score = clamp(100 - totalPenalty, 40, 100);

  return {
    version: LM_CORE_VERSION,
    score,
    classification: classify(score),
    reasons: [...b1.reasons, ...b2.reasons, ...b3.reasons],
    blocks: {
      body: b1,
      activity: b2,
      expectation: b3,
      totalPenalty,
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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

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
 * Agregação ponderada por penalidade (compatível com engine punitivo).
 * Mantém a lógica: score parte de 100 e só penaliza.
 *
 * Ideia:
 * - Cada bloco calcula penalty (0..maxPenalty do bloco)
 * - Aqui ponderamos o impacto de cada bloco pela config
 * - Importante: isso muda score se você trocar o modo default.
 *   Então v1.2 deve introduzir isso APENAS como modo opcional.
 */
function applyWeightsToPenalties(blocks) {
  const keys = Object.keys(blocks);
  const { weights } = getNormalizedWeights(keys);

  let totalPenaltyWeighted = 0;

  for (const k of keys) {
    const b = blocks[k] || {};
    const penalty = Number.isFinite(b.penalty) ? b.penalty : 0;

    const w = weights[k];
    b.weightApplied = w; // telemetria/QA

    totalPenaltyWeighted += penalty * w;
  }

  return totalPenaltyWeighted;
}