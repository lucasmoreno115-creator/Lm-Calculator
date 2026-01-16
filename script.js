/**
 * APP ADAPTER (v0.9 + v1.1 copy)
 * - Não contém ciência do score
 * - Só coleta dados, chama o core e renderiza
 * - v1.1: adiciona camada educacional (copy) SEM alterar score/pesos/blocos
 */

import { calculateLMScore } from "./core/lmScoreEngine.js";
import { LM_COPY_V11 } from "./core/lmCopy_v1_1.js";

const els = {
  calcBtn: document.getElementById("calcBtn"),
  result: document.getElementById("result"),
  score: document.getElementById("score"),
  classification: document.getElementById("classification"),
  mainFactor: document.getElementById("mainFactor"),
  debug: document.getElementById("debug"),
};

els.calcBtn.addEventListener("click", () => {
  const data = collectFormData();
  const errors = validateInput(data);

  if (errors.length) {
    alert(errors.join("\n"));
    return;
  }

  const result = calculateLMScore(data);
  renderResult(result);
});

// -------------------------------
// Coleta de dados (UI -> core)
// -------------------------------
function collectFormData() {
  const bodyFatRaw = document.getElementById("bodyFat").value;

  return {
    sex: document.getElementById("sex").value,
    age: Number(document.getElementById("age").value),
    weight: Number(document.getElementById("weight").value),
    height: Number(document.getElementById("height").value),

    // Importante: não “inventar” 0% gordura se não preenchido
    bodyFat: bodyFatRaw ? Number(bodyFatRaw) : undefined,

    activityLevel: document.getElementById("activityLevel").value,
    trainingFrequency: Number(document.getElementById("trainingFrequency").value),
    strengthTraining: document.getElementById("strengthTraining").checked,

    expectation: document.getElementById("expectation").value,
  };
}

// -------------------------------
// Validação (somente UI)
// -------------------------------
function buildEducationalText(result) {
  const band = pickBand(result.score);
  if (!band) {
    return result.reasons?.length
      ? result.reasons.join(" ")
      : "Nenhum fator de risco relevante identificado.";
  }

  const topReasons = Array.isArray(result.reasons) ? result.reasons.slice(0, 2) : [];
  const reasonsLine = topReasons.length
    ? `Principal fator: ${topReasons.join(" ")}`
    : null;

  const nextSteps = band.nextSteps.map((s) => `• ${s}`).join("\n");

  return [
    band.headline,
    reasonsLine ? reasonsLine : null,
    band.explanation,
    "",
    "Próximo passo:",
    nextSteps,
    "",
    `Evite: ${band.dontDo}`,
    "",
    `Nota: ${LM_COPY_V11.disclaimers.coreFrozen}`,
    `Nota: ${LM_COPY_V11.disclaimers.nonPrescriptive}`,
  ].filter(Boolean).join("\n");
}

  return errs;
}

// -------------------------------
// v1.1 — Camada educacional (copy only)
// -------------------------------
function pickBand(score) {
  // Mantém exatamente as faixas do LM_COPY_V11
  if (score >= 85) return LM_COPY_V11.scoreBands.find((b) => b.key === "A");
  if (score >= 65) return LM_COPY_V11.scoreBands.find((b) => b.key === "B");
  if (score >= 45) return LM_COPY_V11.scoreBands.find((b) => b.key === "C");
  return LM_COPY_V11.scoreBands.find((b) => b.key === "D");
}

function buildEducationalText(result) {
  const band = pickBand(result.score);

  // Fallback seguro (caso alguém apague band sem querer)
  if (!band) {
    return result.reasons?.length
      ? result.reasons.join(" ")
      : "Nenhum fator de risco relevante identificado.";
  }

  const nextSteps = band.nextSteps.map((s) => `• ${s}`).join("\n");

  return [
    band.headline,
    band.explanation,
    "",
    "Próximo passo:",
    nextSteps,
    "",
    `Evite: ${band.dontDo}`,
    "",
    `Nota: ${LM_COPY_V11.disclaimers.coreFrozen}`,
    `Nota: ${LM_COPY_V11.disclaimers.nonPrescriptive}`,
  ].join("\n");
}

// -------------------------------
// Renderização (core -> UI)
// -------------------------------
function renderResult(result) {
  els.result.style.display = "block";

  els.score.textContent = String(result.score);
  els.classification.textContent = result.classification;

  // v1.1: preferir texto educacional; se der ruim, cair para reasons
  els.mainFactor.textContent = buildEducationalText(result);

  if (els.debug) {
    els.debug.textContent = JSON.stringify(result, null, 2);
  }
}
