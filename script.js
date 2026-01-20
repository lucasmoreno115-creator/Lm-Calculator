/**
 * APP ADAPTER (v0.9 + v1.1 copy + penalties panel)
 * - Não contém ciência do score
 * - Só coleta dados, chama o core e renderiza
 * - v1.1: camada educacional (copy) SEM alterar score/pesos/blocos
 * - v1.1+: painel de penalizações por bloco (transparência)
 */

import { calculateLMScore } from "./core/lmScoreEngine.js";
import { LM_COPY_V11 } from "./core/lmCopy_v1_1.js";
import { LM_REASON_MAP_V13 } from "./core/lmReasonMap_v1_3.js";
import { LM_REASON_COPY_V13 } from "./core/lmReasonCopy_v1_3.js";

const els = {
  calcBtn: document.getElementById("calcBtn"),
  result: document.getElementById("result"),
  score: document.getElementById("score"),
  classification: document.getElementById("classification"),
  mainFactor: document.getElementById("mainFactor"),
  penalties: document.getElementById("penalties"),
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
function validateInput(d) {
  const errs = [];

  if (!d.sex) errs.push("Sexo é obrigatório.");
  if (!Number.isFinite(d.age) || d.age <= 0) errs.push("Idade inválida.");
  if (!Number.isFinite(d.weight) || d.weight <= 0) errs.push("Peso inválido.");
  if (!Number.isFinite(d.height) || d.height <= 0) errs.push("Altura inválida.");

  if (!Number.isFinite(d.trainingFrequency) || d.trainingFrequency < 0 || d.trainingFrequency > 7) {
    errs.push("Frequência de treino deve estar entre 0 e 7.");
  }

  if (d.bodyFat !== undefined && (!Number.isFinite(d.bodyFat) || d.bodyFat < 0 || d.bodyFat > 60)) {
    errs.push("% de gordura deve estar entre 0 e 60.");
  }

  return errs;
}

// -------------------------------
// v1.1 — Camada educacional (copy only)
// -------------------------------
function pickBand(score) {
  if (score >= 85) return LM_COPY_V11.scoreBands.find((b) => b.key === "A");
  if (score >= 65) return LM_COPY_V11.scoreBands.find((b) => b.key === "B");
  if (score >= 45) return LM_COPY_V11.scoreBands.find((b) => b.key === "C");
  return LM_COPY_V11.scoreBands.find((b) => b.key === "D");
}

function buildEducationalText(result) {
  const band = pickBand(result.score);

  // Fallback seguro (se copy faltar por algum motivo)
  if (!band) {
    return result.reasons?.length
      ? result.reasons.map((reason) => getReasonText(reason)).join(" ")
      : "Nenhum fator de risco relevante identificado.";
  }

  // Mostra 1–2 razões principais (se existirem), para não ficar genérico
  const topReasons = Array.isArray(result.reasons) ? result.reasons.slice(0, 2) : [];
  const reasonsLine = topReasons.length
    ? `Principal fator: ${topReasons.map((reason) => getReasonText(reason)).join(" ")}`
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

// -------------------------------
// Painel de penalizações por bloco
// (assume chaves: body/activity/expectation)
// -------------------------------
function renderPenalties(result) {
  if (!els.penalties) return;

  const blocks = result.blocks || {};

  const items = [
    { key: "body", label: "Bloco 1 — Composição corporal" },
    { key: "activity", label: "Bloco 2 — Atividade física" },
    { key: "expectation", label: "Bloco 3 — Expectativa" },
  ];

  els.penalties.innerHTML = items
    .map(({ key, label }) => buildPenaltyCard(label, blocks[key]))
    .join("");
}

function buildPenaltyCard(label, block) {
  if (!block) {
    return `
      <div class="penaltyCard">
        <div class="penaltyHeader">
          <span>${escapeHtml(label)}</span>
          <span class="penaltyScore">—</span>
        </div>
        <div class="penaltyMeta">Sem dados do bloco.</div>
      </div>
    `;
  }

  const penalty = Number.isFinite(block.penalty) ? block.penalty : 0;
  const reasons = Array.isArray(block.reasons) ? block.reasons : [];
  const reasonsContent = reasons.length
    ? reasons.map((reason) => renderReason(reason)).join("")
    : `<div class="penaltyMeta">Sem penalizações relevantes.</div>`;

  return `
    <div class="penaltyCard">
      <div class="penaltyHeader">
        <span>${escapeHtml(label)}</span>
        <span class="penaltyScore">-${penalty} pts</span>
      </div>
      <div class="penaltyReasons">${reasonsContent}</div>
    </div>
  `;
}

function renderReason(reason) {
  const reasonText = getReasonText(reason);
  const reasonCode = typeof reason === "object" && reason ? reason.code : null;
  const code = reasonCode || LM_REASON_MAP_V13?.[reasonText];
  const reasonCopy = code ? LM_REASON_COPY_V13?.reasons?.[code] : null;

  if (!reasonCopy) {
    return `<div class="penaltyMeta">${escapeHtml(reasonText)}</div>`;
  }

  return `
    <div class="penaltyReason">
      <div class="penaltyReasonTitle">${escapeHtml(reasonCopy.title)}</div>
      <div class="penaltyMeta">${escapeHtml(reasonCopy.explanation)}</div>
      <div class="penaltyMeta"><strong>Impacto:</strong> ${escapeHtml(reasonCopy.impact)}</div>
      <div class="penaltyMeta"><strong>Evite:</strong> ${escapeHtml(reasonCopy.dontDo)}</div>
    </div>
  `;
}

function getReasonText(reason) {
  if (typeof reason === "string") return reason;
  if (reason && typeof reason === "object") {
    return typeof reason.text === "string" ? reason.text : String(reason.text ?? "");
  }
  return String(reason ?? "");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// -------------------------------
// Renderização (core -> UI)
// -------------------------------
function renderResult(result) {
  // Mostra card
  els.result.classList.remove("resultHidden");

  els.score.textContent = String(result.score);
  els.classification.textContent = result.classification;

  // v1.1: texto educacional + principal fator
  els.mainFactor.textContent = buildEducationalText(result);

  // Transparência: penalizações por bloco
  renderPenalties(result);

  // Debug completo (continua para QA)
  if (els.debug) {
    els.debug.textContent = JSON.stringify(result, null, 2);
  }
}
