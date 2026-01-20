export const LM_REASON_COPY_V13 = {
  version: "1.3",
  locale: "pt-BR",
  reasons: {
    B1_OBESITY_GRADE_II_PLUS: {
      title: "Obesidade grau II+",
      explanation:
        "O IMC está em faixa associada a maior risco metabólico e menor tolerância a mudanças agressivas.",
      impact: "Eleva bastante a penalização do bloco de composição corporal.",
      dontDo: "Não trate o score como sentença ou licença para cortes extremos.",
      block: "body"
    },
    B1_OBESITY_GRADE_I: {
      title: "Obesidade grau I",
      explanation:
        "O IMC sugere risco metabólico aumentado, pedindo abordagem mais conservadora.",
      impact: "Gera penalização relevante no bloco corporal.",
      dontDo: "Não tente compensar com mudanças bruscas de rotina.",
      block: "body"
    },
    B1_OVERWEIGHT_HIGH_BODY_FAT: {
      title: "Sobrepeso com gordura alta",
      explanation:
        "O sobrepeso combinado com gordura corporal elevada indica risco moderado.",
      impact: "Adiciona penalização intermediária ao bloco corporal.",
      dontDo: "Não ignore a composição corporal ao interpretar o score.",
      block: "body"
    },
    B1_OVERWEIGHT_MILD: {
      title: "Sobrepeso leve",
      explanation:
        "O IMC indica sobrepeso leve, com risco potencial que pede ajustes graduais.",
      impact: "Aplica penalização pequena, mas consistente, no bloco corporal.",
      dontDo: "Não trate isso como urgência para mudanças drásticas.",
      block: "body"
    },
    B1_AGE_CAUTION: {
      title: "Faixa etária com maior cautela",
      explanation:
        "A idade aumenta a necessidade de prudência metabólica em estratégias muito agressivas.",
      impact: "Adiciona penalização leve no bloco corporal.",
      dontDo: "Não interprete como impedimento para progresso.",
      block: "body"
    },
    B1_BODY_FAT_MISSING: {
      title: "% de gordura não informado",
      explanation:
        "Sem esse dado, a estimativa de risco metabólico fica menos precisa.",
      impact: "Não altera a pontuação, mas reduz a precisão do diagnóstico.",
      dontDo: "Não suponha valores para melhorar o resultado.",
      block: "body"
    },
    B2_SEDENTARY: {
      title: "Sedentarismo declarado",
      explanation:
        "Baixa atividade diária reduz eficiência do déficit e dificulta aderência.",
      impact: "Penalização alta no bloco de atividade física.",
      dontDo: "Não compense apenas com dieta mais restrita.",
      block: "activity"
    },
    B2_LOW_ACTIVITY: {
      title: "Atividade leve",
      explanation:
        "Atividade limitada desacelera o progresso e aumenta dependência de dieta precisa.",
      impact: "Penalização moderada no bloco de atividade.",
      dontDo: "Não ignore o papel do movimento diário.",
      block: "activity"
    },
    B2_LOW_TRAINING_FREQUENCY: {
      title: "Baixa frequência de treino",
      explanation:
        "Treinos abaixo de 3x/sem reduzem o estímulo mínimo para consistência.",
      impact: "Adiciona penalização recorrente no bloco de atividade.",
      dontDo: "Não trate treinos esporádicos como equivalentes a rotina regular.",
      block: "activity"
    },
    B2_NO_STRENGTH_TRAINING: {
      title: "Sem musculação",
      explanation:
        "A ausência de musculação aumenta o risco de perda de massa magra.",
      impact: "Aumenta a penalização do bloco de atividade.",
      dontDo: "Não subestime o impacto de força na composição corporal.",
      block: "activity"
    },
    B2_MODERATE_INCONSISTENT: {
      title: "Atividade moderada inconsistente",
      explanation:
        "A declaração de atividade moderada precisa ser sustentada por frequência e musculação.",
      impact: "Adiciona uma observação educacional para coerência do bloco.",
      dontDo: "Não marque moderado se a execução não acompanha.",
      block: "activity"
    },
    B3_EXPECTATION_AGGRESSIVE: {
      title: "Expectativa agressiva",
      explanation:
        "Metas muito rápidas elevam risco de frustração e abandono.",
      impact: "Penalização base no bloco de expectativa.",
      dontDo: "Não trate o score como incentivo a acelerar ainda mais.",
      block: "expectation"
    },
    B3_FAST_EXPECTATION_LOW_ACTIVITY: {
      title: "Rápido com baixa atividade",
      explanation:
        "Expectativa rápida combinada com baixa atividade reduz previsibilidade do resultado.",
      impact: "Penalização adicional no bloco de expectativa.",
      dontDo: "Não ignore a execução ao definir metas.",
      block: "expectation"
    },
    B3_EXPECTATION_INCOMPATIBLE: {
      title: "Expectativa incompatível",
      explanation:
        "A combinação atual dificulta sustentar resultados, indicando necessidade de base mais sólida.",
      impact: "Penalização máxima no bloco de expectativa.",
      dontDo: "Não force metas agressivas sem ajustar a rotina.",
      block: "expectation"
    }
  }
};
