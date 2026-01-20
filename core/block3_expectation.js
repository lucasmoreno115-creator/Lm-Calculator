/**
 * BLOCO 3 — EXPECTATIVA & ADESÃO (até 30 pts)
 *
 * Implementa o lock:
 * - Expectativa rápida sempre penaliza
 * - Penaliza mais quando combinada com baixa atividade
 * - Pode virar “incompatível” (penalização máxima)
 */

export function block3Expectation(d, b1, b2) {
  let penalty = 0;
  const reasons = [];
  const block = "expectation";

  const isFast = d.expectation === "fast";
  if (!isFast) {
    return {
      penalty: 0,
      reasons: [],
      meta: { expectation: d.expectation }
    };
  }

  // Base
 penalty += 15;
reasons.push({
  code: "B3_EXPECTATION_AGGRESSIVE",
  text: "Expectativa agressiva aumenta risco de frustração e abandono.",
  block
});

const lowActivityContext =
  d.activityLevel === "sedentary" || d.trainingFrequency < 3;

if (lowActivityContext) {
  penalty += 10;
  reasons.push(
    {
      code: "B3_FAST_EXPECTATION_LOW_ACTIVITY",
      text: "Expectativa rápida com baixa atividade reduz previsibilidade e aumenta risco de falha.",
      block
    }
  );
}
  
  // Incompatível = combinação “ruim + ruim”
  const incompatible =
    d.activityLevel === "sedentary" && d.trainingFrequency < 3;

  if (incompatible) {
    penalty = 30;
    reasons.push(
      {
        code: "B3_EXPECTATION_INCOMPATIBLE",
        text: "Expectativa incompatível com o nível atual: primeiro estabilizar rotina e consistência.",
        block
      }
    );
  }

  // Teto do bloco
  penalty = Math.min(penalty, 30);

  return {
    penalty,
    reasons,
    meta: {
      expectation: d.expectation,
      lowActivityContext,
      incompatible,
      penaltiesSoFar: {
        block1: b1?.penalty ?? null,
        block2: b2?.penalty ?? null
      }
    }
  };
}
