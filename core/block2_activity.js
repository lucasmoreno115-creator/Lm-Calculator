/**
 * BLOCO 2 — ATIVIDADE FÍSICA (até 35 pts)
 *
 * Implementa o lock:
 * - Sedentarismo pesa muito
 * - Frequência baixa penaliza
 * - Sem musculação penaliza
 */

export function block2Activity(d) {
  let penalty = 0;
  const reasons = [];

  // Penalização por “atividade declarada”
if (d.activityLevel === "sedentary") {
  penalty += 20; // era 25
  reasons.push({
    code: "ACTIVITY_SEDENTARY",
    message: "Sedentarismo reduz eficiência do déficit e aumenta dificuldade de adesão.",
  });
} else if (d.activityLevel === "light") {
  penalty += 15;
  reasons.push({
    code: "ACTIVITY_LIGHT",
    message: "Baixa atividade limita ritmo de progresso e aumenta dependência de dieta perfeita.",
  });
} else if (d.activityLevel === "moderate") {
  // Moderate não deve ser penalizado se a execução é coerente
  penalty += 0;
} else {
  // high
  penalty += 0;
}

// Frequência <3 penaliza
if (d.trainingFrequency < 3) {
  penalty += 5;
  reasons.push({
    code: "TRAINING_FREQUENCY_LOW",
    message: "Treino <3x/sem reduz estímulo mínimo para progresso consistente.",
  });
}

// Sem musculação penaliza
if (!d.strengthTraining) {
  penalty += 5;
  reasons.push({
    code: "STRENGTH_TRAINING_MISSING",
    message: "Sem musculação: maior risco de perder massa magra e piorar composição corporal.",
  });
}

// Educação quando a execução não sustenta a declaração
if (d.activityLevel === "moderate" && (d.trainingFrequency < 3 || !d.strengthTraining)) {
  reasons.push({
    code: "ACTIVITY_MODERATE_INCONSISTENT",
    message:
      "Atividade moderada exige consistência (frequência e musculação) para ser real na prática.",
  });
}

  // Sem musculação penaliza
  if (!d.strengthTraining) {
    penalty += 5;
    reasons.push({
      code: "STRENGTH_TRAINING_MISSING",
      message: "Sem musculação: maior risco de perder massa magra e piorar composição corporal.",
    });
  }

  // Se declarou moderate mas tem baixa execução, educa (sem inventar)
  if (d.activityLevel === "moderate" && (d.trainingFrequency < 3 || !d.strengthTraining)) {
    reasons.push({
      code: "ACTIVITY_MODERATE_INCONSISTENT",
      message:
        "Atividade moderada exige consistência (frequência e musculação) para ser real na prática.",
    });
  }

  // Frequência <3 penaliza (mesmo que “se declare ativo”)
  if (d.trainingFrequency < 3) {
    penalty += 5;
    reasons.push({
      code: "TRAINING_FREQUENCY_LOW",
      message: "Treino <3x/sem reduz estímulo mínimo para progresso consistente.",
    });
  }

  // Sem musculação penaliza
  if (!d.strengthTraining) {
    penalty += 5;
    reasons.push({
      code: "STRENGTH_TRAINING_MISSING",
      message: "Sem musculação: maior risco de perder massa magra e piorar composição corporal.",
    });
  }

  // Teto do bloco
  penalty = Math.min(penalty, 35);

  return {
    penalty,
    reasons,
    meta: {
      declaredActivity: d.activityLevel,
      trainingFrequency: d.trainingFrequency,
      strengthTraining: d.strengthTraining,
    },
  };
}
