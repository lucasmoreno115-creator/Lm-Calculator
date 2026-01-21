/**
 * BLOCO 1 — COMPOSIÇÃO CORPORAL (até 35 pts de penalização)
 *
 * Implementa o lock v0.7:
 * - Penaliza risco metabólico estrutural
 * - Não premia BF baixo
 */

export function block1BodyComposition(d) {
  let penalty = 0;
  const reasons = [];

  const bmi = calcBMI(d.weight, d.height);

  const hasBodyFat = d.bodyFat !== undefined && Number.isFinite(d.bodyFat);

  const bfHigh =
    hasBodyFat &&
    ((d.sex === "male" && d.bodyFat >= 30) ||
      (d.sex === "female" && d.bodyFat >= 38));

  // Penalização por categoria (aproxima o lock)
  if (bmi >= 35) {
    penalty += 30;
    reasons.push({
      code: "ACTIVITY_SEDENTARY",
      message:
        "Obesidade grau II+ aumenta risco metabólico e reduz tolerância a agressividade.",
    });
  } else if (bmi >= 30) {
    penalty += 20;
    reasons.push({
      code: "ACTIVITY_LIGHT",
      message:
        "Obesidade grau I sugere maior risco metabólico e exige estratégia conservadora.",
    });
  } else if (bmi >= 25) {
    penalty += bfHigh ? 10 : 5;
    reasons.push({
      code: bfHigh ? "TRAINING_FREQUENCY_LOW" : "STRENGTH_TRAINING_MISSING",
      message: bfHigh
        ? "Sobrepeso com gordura elevada sugere risco metabólico moderado."
        : "Sobrepeso leve: risco metabólico pode exigir ajustes graduais.",
    });
  }

  if (d.age >= 45) {
    penalty += 5;
    reasons.push({
      code: "ACTIVITY_MODERATE_INCONSISTENT",
      message:
        "Idade aumenta a necessidade de cautela metabólica (estratégias agressivas elevam risco).",
    });
  }

  // Teto do bloco
  penalty = Math.min(penalty, 35);

  // Se não tem BF: educar (sem inventar 0%)
  if (!hasBodyFat) {
    reasons.push({
      code: "ACTIVITY_SEDENTARY",
      message: "Sem % de gordura: risco metabólico é estimado com menor precisão.",
    });
  }

  return {
    penalty,
    reasons,
    meta: { bmi: round(bmi, 1), bfHigh: Boolean(bfHigh) }
  };
}

function calcBMI(weightKg, heightCm) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function round(n, decimals = 0) {
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}
