export const LM_COPY_V11 = {
  version: "1.1",
  locale: "pt-BR",
  intent: "educational_layer_only",
  disclaimers: {
    coreFrozen:
      "Camada educacional v1.1: nenhum peso, threshold, bloco ou lógica do LM Score foi alterado.",
    nonPrescriptive:
      "O LM Score é um indicador educacional e punitivo (parte de 100 e só penaliza). Ele aponta desalinhamentos, não prescreve condutas.",
  },
  scoreBands: [
    {
      key: "A",
      rangeLabel: ">= 85",
      headline: "Boa consistência com poucos desvios",
      explanation:
        "Seu resultado indica que a maior parte dos fatores avaliados está dentro do esperado. As penalizações foram pequenas e sugerem pontos pontuais de melhoria, não um problema estrutural.",
      nextSteps: [
        "Revise os itens penalizados e confirme se os dados inseridos refletem sua rotina real.",
        "Priorize corrigir 1–2 pontos por vez para reduzir penalizações recorrentes.",
        "Recalcule após ajustes consistentes (mesmas premissas, por alguns dias/semana).",
      ],
      dontDo:
        "Não superinterprete diferenças pequenas (ex.: 2–5 pontos) nem use o score como prova de que “está perfeito” — ele mede alinhamento com critérios, não garante resultado.",
    },
    {
      key: "B",
      rangeLabel: "65–84",
      headline: "Alinhamento moderado, com lacunas relevantes",
      explanation:
        "O score sugere que há fatores suficientes fora do ideal para gerar penalizações claras. Em geral, isso significa inconsistências de rotina, entradas incompletas ou escolhas que aumentam a chance de variação no progresso.",
      nextSteps: [
        "Confira se peso/altura/idade/nível de atividade e demais campos foram preenchidos corretamente e sem estimativas grosseiras.",
        "Identifique quais categorias concentram mais penalização e trate como prioridade de revisão.",
        "Repita o cálculo com o mesmo padrão de dados para evitar “oscilação por chute”.",
      ],
      dontDo:
        "Não tente “compensar” o score mudando vários inputs ao mesmo tempo para forçar um número maior — isso só mascara o diagnóstico e reduz a utilidade do resultado.",
    },
    {
      key: "C",
      rangeLabel: "45–64",
      headline: "Desalinhamento alto; score aponta problemas centrais",
      explanation:
        "Aqui, as penalizações acumuladas costumam indicar que uma ou mais premissas importantes estão fora do esperado. O resultado é mais útil como sinal de revisão de base do que como comparação entre dias.",
      nextSteps: [
        "Revalide os dados de entrada: valores extremos, inconsistentes ou aproximados tendem a gerar penalizações maiores.",
        "Revise as áreas mais penalizadas e trate como “causas raiz”, não detalhes.",
        "Use o score para checar consistência: mantenha entradas estáveis e observe se as penalizações se repetem.",
      ],
      dontDo:
        "Não use este score para tomar decisões rápidas ou drásticas (cortar/elevar demais, mudar tudo de uma vez). O objetivo aqui é corrigir premissas e consistência, não reagir ao número.",
    },
    {
      key: "D",
      rangeLabel: "< 45",
      headline: "Inconsistência crítica ou dados fora de premissa",
      explanation:
        "Esse nível geralmente aparece quando há grande desalinhamento com os critérios do modelo ou quando os dados inseridos não representam bem a realidade. O score sinaliza baixa confiabilidade prática para comparação até que as entradas e a base estejam coerentes.",
      nextSteps: [
        "Reconfira todos os campos e evite estimativas: dados incorretos podem derrubar o score de forma desproporcional.",
        "Procure padrões nas penalizações: repetição costuma indicar o ponto central a ser revisado primeiro.",
        "Recalcule apenas após ajustar a qualidade/consistência dos dados, mantendo as mesmas premissas de entrada.",
      ],
      dontDo:
        "Não use o score como rótulo (“estou mal”) nem como gatilho para mudanças agressivas. Trate como sinal de revisão de dados e coerência com as premissas avaliadas.",
    },
  ],
};
