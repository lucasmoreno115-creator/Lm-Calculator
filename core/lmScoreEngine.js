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

const LM_REASON_COPY_V1_3 = {
  BODYCOMP_OBESITY_GRADE_2_PLUS:
    "Obesidade grau II+ aumenta risco metabólico e reduz tolerância a agressividade.",
  BODYCOMP_OBESITY_GRADE_1:
    "Obesidade grau I sugere maior risco metabólico e exige estratégia conservadora.",
  BODYCOMP_OVERWEIGHT_HIGH_BF:
    "Sobrepeso com gordura elevada sugere risco metabólico moderado.",
  BODYCOMP_OVERWEIGHT_LIGHT:
    "Sobrepeso leve: risco metabólico pode exigir ajustes graduais.",
  BODYCOMP_AGE_CAUTION:
    "Idade aumenta a necessidade de cautela metabólica (estratégias agressivas elevam risco).",
  BODYCOMP_NO_BODYFAT_ESTIMATE:
    "Sem % de gordura: risco metabólico é estimado com menor precisão.",
  ACTIVITY_SEDENTARY:
    "Sedentarismo reduz eficiência do déficit e aumenta dificuldade de adesão.",
  ACTIVITY_LIGHT:
    "Baixa atividade limita ritmo de progresso e aumenta dependência de dieta perfeita.",
  ACTIVITY_LOW_FREQUENCY:
    "Treino <3x/sem reduz estímulo mínimo para progresso consistente.",
  ACTIVITY_NO_STRENGTH:
    "Sem musculação: maior risco de perder massa magra e piorar composição corporal.",
  ACTIVITY_MODERATE_INCONSISTENT:
    "Atividade moderada exige consistência (frequência e musculação) para ser real na prática.",
  EXPECTATION_AGGRESSIVE:
    "Expectativa agressiva aumenta risco de frustração e abandono.",
  EXPECTATION_FAST_LOW_ACTIVITY:
    "Expectativa rápida com baixa atividade reduz previsibilidade e aumenta risco de falha.",
  EXPECTATION_INCOMPATIBLE:
    "Expectativa incompatível com o nível atual: primeiro estabilizar rotina e consistência.",
};

const LM_REASON_CODE_BY_MESSAGE = Object.entries(LM_REASON_COPY_V1_3).reduce(
  (acc, [code, message]) => {
    acc[message] = code;
    return acc;
  },
  {}
);

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

  const normalizedBlocks = {
    body: { ...b1, reasons: normalizeReasonsArray(b1.reasons) },
    activity: { ...b2, reasons: normalizeReasonsArray(b2.reasons) },
    expectation: { ...b3, reasons: normalizeReasonsArray(b3.reasons) },
  };

  return {
    version: LM_CORE_VERSION,
    mode,
    weightsVersion: LM_WEIGHTS_V12?.version || "none",

    score,
    classification: classify(score),

    // Razões educacionais (flat)
    reasons: [
      ...normalizedBlocks.body.reasons,
      ...normalizedBlocks.activity.reasons,
      ...normalizedBlocks.expectation.reasons,
    ],

    // Debug por bloco + totais
    blocks: {
      ...normalizedBlocks,
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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeReason(reason) {
  if (reason && typeof reason === "object") {
    if (typeof reason.code === "string" && reason.code.length > 0) {
      if (typeof reason.message === "string" && reason.message.length > 0) {
        return reason;
      }
    }
    throw new Error("[LM] Invalid reason object format.");
  }

  if (typeof reason === "string") {
    const code = LM_REASON_CODE_BY_MESSAGE[reason];
    if (!code) {
      throw new Error("[LM] Unknown reason string format.");
    }
    return { code, message: reason };
  }

  throw new Error("[LM] Invalid reason format.");
}

function normalizeReasonsArray(reasons) {
  return (Array.isArray(reasons) ? reasons : []).map((reason) =>
    normalizeReason(reason)
  );
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
