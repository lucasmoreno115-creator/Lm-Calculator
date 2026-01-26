try {
  const statusEl = document.getElementById("bootStatus");
  if (statusEl) statusEl.textContent = "Boot: script executando (JS top-level)";
} catch (error) {
  // noop
}

/**
 * APP ADAPTER (v0.9 + v1.1 copy + penalties panel)
 * - Não contém ciência do score
 * - Só coleta dados, chama o core e renderiza
 * - v1.1: camada educacional (copy) SEM alterar score/pesos/blocos
 * - v1.1+: painel de penalizações por bloco (transparência)
 */

let calculateLMScore;
let LM_COPY_V11;
let LM_REASON_EXPLAIN_V1;

function renderFatalBootError(message) {
  const root = document.getElementById("appRoot");
  if (!root) return;
  root.innerHTML = `
    <div class="bootError">
      <h2>❌ Erro ao carregar a interface</h2>
      <p class="bootErrorCode">Código: UI-BOOT</p>
      <p class="bootErrorDetail">${message}</p>
      <div class="bootErrorActions">
        <button type="button" id="bootReload">Recarregar</button>
        <button type="button" id="bootResetMode">Resetar modo</button>
      </div>
    </div>
  `;

  const reloadBtn = document.getElementById("bootReload");
  const resetBtn = document.getElementById("bootResetMode");

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      window.location.reload();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem("lm_ui_mode");
      window.location.reload();
    });
  }
}

try {
  const coreModule = await import("./core/lmScoreEngine.js");
  calculateLMScore = coreModule.calculateLMScore;
  const copyModule = await import("./core/lmCopy_v1_1.js");
  LM_COPY_V11 = copyModule.LM_COPY_V11;
  const explainModule = await import("./presentation/lmReasonExplain_v1.js");
  LM_REASON_EXPLAIN_V1 = explainModule.LM_REASON_EXPLAIN_V1;
} catch (error) {
  const message = `Boot: ERRO (JS) - ${error?.message || "Falha ao importar módulos"}`;
  const statusEl = document.getElementById("bootStatus");
  if (statusEl) statusEl.textContent = message;
  renderFatalBootError(message);
  throw error;
}

const coreModule = await import("./core/lmScoreEngine.js");
calculateLMScore = coreModule.calculateLMScore;
const copyModule = await import("./core/lmCopy_v1_1.js");
LM_COPY_V11 = copyModule.LM_COPY_V11;
const explainModule = await import("./presentation/lmReasonExplain_v1.js");
LM_REASON_EXPLAIN_V1 = explainModule.LM_REASON_EXPLAIN_V1;

const appRoot = document.getElementById("appRoot");
let bootStage = "Boot: aguardando script...";

function ensureBootStatusEl() {
  let statusEl = document.getElementById("bootStatus");
  if (!statusEl && appRoot) {
    statusEl = document.createElement("p");
    statusEl.id = "bootStatus";
    statusEl.className = "bootStatusLine";
    appRoot.appendChild(statusEl);
  }
  return statusEl;
}

function setBootStatus(text) {
  bootStage = text;
  const statusEl = ensureBootStatusEl();
  if (statusEl) {
    statusEl.textContent = text;
  }
}

setBootStatus("Boot: script carregado");
window.setTimeout(() => {
  if (bootStage === "Boot: aguardando script...") {
    renderBootError(
      "UI-SCRIPT-NOT-RUNNING",
      "Verifique se ./script.js existe e está sendo servido pelo GitHub Pages"
    );
  }
}, 2000);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setBootStatus("Boot: DOM OK");
  }, { once: true });
} else {
  setBootStatus("Boot: DOM OK");
}
const els = {
  calcBtn: document.getElementById("calcBtn"),
  result: document.getElementById("result"),
  score: document.getElementById("score"),
  classification: document.getElementById("classification"),
  mainFactor: document.getElementById("mainFactor"),
  penalties: document.getElementById("penalties"),
  versionLabel: document.getElementById("versionLabel"),
  resultDate: document.getElementById("resultDate"),
  clientTopImpacts: document.getElementById("clientTopImpacts"),
  clientGroupedReasons: document.getElementById("clientGroupedReasons"),
  topImpacts: document.getElementById("topImpacts"),
  groupedReasons: document.getElementById("groupedReasons"),
  reportBtn: document.getElementById("reportBtn"),
  modeClientBtn: document.getElementById("modeClientBtn"),
  modeDebugBtn: document.getElementById("modeDebugBtn"),
  reportDate: document.getElementById("reportDate"),
  reportScore: document.getElementById("reportScore"),
  reportClassification: document.getElementById("reportClassification"),
  reportTopImpacts: document.getElementById("reportTopImpacts"),
  reportGroups: document.getElementById("reportGroups"),
  reportFooterDate: document.getElementById("reportFooterDate"),
  debug: document.getElementById("debug"),
};

let lastResult = null;
let currentMode = getStoredMode();
let bootReady = false;
let bootTimeoutId = null;

function renderBootError(code = "UI-BOOT", detail = null) {
  if (!appRoot) return;
  if (code && code.startsWith("UI-")) {
    setBootStatus(`Boot: ERRO (JS) - ${code}`);
  }
  appRoot.innerHTML = `
    <div class="bootError">
      <h2>❌ Erro ao carregar a interface</h2>
      <p class="bootErrorCode">Código: ${code}</p>
      ${detail ? `<p class="bootErrorDetail">${detail}</p>` : ""}
      <div class="bootErrorActions">
        <button type="button" id="bootReload">Recarregar</button>
        <button type="button" id="bootResetMode">Resetar modo</button>
      </div>
    </div>
  `;

  const reloadBtn = document.getElementById("bootReload");
  const resetBtn = document.getElementById("bootResetMode");

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      window.location.reload();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem("lm_ui_mode");
      window.location.reload();
    });
  }
}

function bootUI() {
  setBootStatus("Boot: iniciando");
  bootTimeoutId = window.setTimeout(() => {
    if (!bootReady) {
      renderBootError("UI-BOOT-TIMEOUT", `Última etapa: ${bootStage}`);
    }
  }, 2000);

  setBootStatus("Boot: carregando modo");
  applyUIMode(currentMode);

  setBootStatus("Boot: preparando UI");
  if (!els.calcBtn) {
    throw new Error("[LM] Missing calculator button");
  }

  setBootStatus("Boot: renderizando");

  els.calcBtn.addEventListener("click", () => {
    try {
      const data = collectFormData();
      const errors = validateInput(data);

      if (errors.length) {
        alert(errors.join("\n"));
        return;
      }

      const result = calculateLMScore(data);
      lastResult = result;
      renderResultSafe(result);
    } catch (error) {
      renderBootError();
    }
  });

  if (els.reportBtn) {
    els.reportBtn.addEventListener("click", () => {
      window.print();
    });
  }

  if (els.modeClientBtn && els.modeDebugBtn) {
    els.modeClientBtn.addEventListener("click", () => {
      setUIMode("client");
    });
    els.modeDebugBtn.addEventListener("click", () => {
      setUIMode("debug");
    });
  }

  setBootStatus("Boot: pronto");
  bootReady = true;
  if (bootTimeoutId) {
    window.clearTimeout(bootTimeoutId);
  }
  const loadingFallback = document.getElementById("loadingFallback");
  if (loadingFallback) {
    loadingFallback.remove();
  }
}

try {
  bootUI();
} catch (error) {
  setBootStatus(`Boot: ERRO (JS) - ${error?.message || "Falha desconhecida"}`);
  renderBootError("UI-BOOT", `Boot: ERRO (JS) - ${error?.message || "Falha desconhecida"}`);
}

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
  const reasonTexts = getReasonTexts(result.reasons);

  // Fallback seguro (se copy faltar por algum motivo)
  if (!band) {
    return reasonTexts.length
      ? reasonTexts.join(" ")
      : "Nenhum fator de risco relevante identificado.";
  }

  // Mostra 1–2 razões principais (se existirem), para não ficar genérico
  const topReasons = reasonTexts.slice(0, 2);
  const reasonsLine = topReasons.length ? `Principal fator: ${topReasons.join(" ")}` : null;

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
  const reasonsText = buildReasonsHtml(reasons);
  const reasonsFallback = reasons.length ? "" : "Sem penalizações relevantes.";

  return `
    <div class="penaltyCard">
      <div class="penaltyHeader">
        <span>${escapeHtml(label)}</span>
        <span class="penaltyScore">-${penalty} pts</span>
      </div>
      <div class="penaltyMeta">${reasonsText || escapeHtml(reasonsFallback)}</div>
    </div>
  `;
}

function getReasonTexts(reasons) {
  return (Array.isArray(reasons) ? reasons : [])
    .map((reason) => formatReasonText(reason))
    .filter((reasonText) => reasonText !== "");
}

function formatReasonText(reason) {
  if (!reason || typeof reason !== "object") {
    throw new Error("[LM] Invalid reason format in v2.0");
  }

  if (typeof reason.code !== "string" || reason.code.length === 0) {
    throw new Error("[LM] Invalid reason format in v2.0");
  }

  if (typeof reason.message !== "string" || reason.message.length === 0) {
    throw new Error("[LM] Invalid reason format in v2.0");
  }

  return reason.message;
}

function buildReasonsHtml(reasons) {
  return (Array.isArray(reasons) ? reasons : [])
    .map((reason) => {
      if (!reason || typeof reason !== "object") {
        throw new Error("[LM] Invalid reason format in v2.0");
      }

      if (typeof reason.code !== "string" || reason.code.length === 0) {
        throw new Error("[LM] Invalid reason format in v2.0");
      }

      if (typeof reason.message !== "string" || reason.message.length === 0) {
        throw new Error("[LM] Invalid reason format in v2.0");
      }

      const codeAttr = ` data-reason-code="${escapeHtml(reason.code)}"`;
      return `<span${codeAttr}>${escapeHtml(reason.message)}</span>`;
    })
    .filter((reasonHtml) => reasonHtml !== "")
    .join(" ");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function extractReasonCodes(reasons) {
  const summary = {
    codes: [],
  };

  if (!Array.isArray(reasons)) {
    return summary;
  }

  reasons.forEach((reason) => {
    if (!reason || typeof reason !== "object") {
      throw new Error("[LM] Invalid reason format in v2.0");
    }

    if (typeof reason.code !== "string" || reason.code.length === 0) {
      throw new Error("[LM] Invalid reason format in v2.0");
    }

    if (typeof reason.message !== "string" || reason.message.length === 0) {
      throw new Error("[LM] Invalid reason format in v2.0");
    }

    summary.codes.push(reason.code);
  });

  return summary;
}

function buildCodeHistogram(codes) {
  return codes.reduce((acc, code) => {
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {});
}

function getStoredMode() {
  const stored = localStorage.getItem("lm_ui_mode");
  return stored === "debug" ? "debug" : "client";
}

function applyUIMode(mode) {
  document.body.classList.remove("mode-client", "mode-debug");
  document.body.classList.add(mode === "debug" ? "mode-debug" : "mode-client");

  if (els.modeClientBtn && els.modeDebugBtn) {
    els.modeClientBtn.classList.toggle("isActive", mode !== "debug");
    els.modeDebugBtn.classList.toggle("isActive", mode === "debug");
  }
}

function setUIMode(mode) {
  currentMode = mode === "debug" ? "debug" : "client";
  localStorage.setItem("lm_ui_mode", currentMode);
  applyUIMode(currentMode);
  if (lastResult) {
    renderResultSafe(lastResult);
  }
}

function getImpactRank(impacto) {
  if (impacto === "alto") return 0;
  if (impacto === "médio") return 1;
  if (impacto === "baixo") return 2;
  return 3;
}

function getGroupLabel(code) {
  if (code.startsWith("BODYCOMP_")) return "Composição corporal";
  if (code.startsWith("ACTIVITY_")) return "Atividade";
  if (code.startsWith("EXPECTATION_")) return "Expectativa";
  return "Outros";
}

function mapClassificationToClientLabel(classification) {
  if (classification === "Baixo risco metabólico") return "Atenção baixa";
  if (classification === "Risco metabólico leve") return "Atenção moderada";
  if (classification === "Risco metabólico moderado") return "Atenção alta";
  if (classification === "Alto risco metabólico") return "Atenção alta";
  return "Atenção";
}

function buildExplainData(reason, index) {
  if (!reason || typeof reason !== "object") {
    throw new Error("[LM] Invalid reason format in v2.0");
  }

  if (typeof reason.code !== "string" || reason.code.length === 0) {
    throw new Error("[LM] Invalid reason format in v2.0");
  }

  if (typeof reason.message !== "string" || reason.message.length === 0) {
    throw new Error("[LM] Invalid reason format in v2.0");
  }

  const explain = LM_REASON_EXPLAIN_V1[reason.code];
  if (!explain) {
    return {
      code: reason.code,
      impacto: "—",
      explicacaoCliente: `Motivo identificado (código: ${reason.code}). Recomendação indisponível nesta versão.`,
      acaoRecomendada: "Recomendação indisponível nesta versão.",
      prioridade: "—",
      group: getGroupLabel(reason.code),
      index,
    };
  }

  return {
    code: reason.code,
    impacto: explain.impacto,
    explicacaoCliente: explain.explicacaoCliente,
    acaoRecomendada: explain.acaoRecomendada,
    prioridade: explain.prioridade,
    group: getGroupLabel(reason.code),
    index,
  };
}

function getClientTitle(text) {
  const [firstSentence] = text.split(".");
  return firstSentence ? firstSentence.trim() : text;
}

function buildClientExplainData(reason, index) {
  const data = buildExplainData(reason, index);

  if (data.impacto === "—") {
    return {
      title: "Motivo identificado.",
      explicacaoCliente: "Motivo identificado.",
      acaoRecomendada: "Recomendação indisponível nesta versão.",
      group: data.group,
      index,
    };
  }

  return {
    title: getClientTitle(data.explicacaoCliente),
    explicacaoCliente: data.explicacaoCliente,
    acaoRecomendada: data.acaoRecomendada,
    group: data.group,
    index,
  };
}

function sortExplainData(a, b) {
  const priorityA = typeof a.prioridade === "number" ? a.prioridade : 99;
  const priorityB = typeof b.prioridade === "number" ? b.prioridade : 99;

  if (priorityA !== priorityB) return priorityA - priorityB;

  const impactA = getImpactRank(a.impacto);
  const impactB = getImpactRank(b.impacto);

  if (impactA !== impactB) return impactA - impactB;

  return a.index - b.index;
}

function renderReasonList(items) {
  if (!items.length) {
    return `<div class="reasonGroup"><div class="reasonText muted">Nenhum motivo identificado.</div></div>`;
  }

  return items
    .map((item) => {
      const impactoLabel = item.impacto === "—" ? "Impacto indisponível" : `Impacto: ${item.impacto}`;
      const prioridadeLabel =
        item.prioridade === "—" ? "Prioridade indisponível" : `Prioridade: ${item.prioridade}`;

      return `
        <div class="reasonItem">
          <div class="reasonMeta">
            <span class="badge">${escapeHtml(impactoLabel)}</span>
            <span class="badge">${escapeHtml(prioridadeLabel)}</span>
            <span class="badge">${escapeHtml(item.code)}</span>
          </div>
          <div class="reasonText">${escapeHtml(item.explicacaoCliente)}</div>
          <div class="reasonAction">${escapeHtml(item.acaoRecomendada)}</div>
        </div>
      `;
    })
    .join("");
}

function renderClientList(items) {
  if (!items.length) {
    return `<div class="clientCard"><div class="muted">Nenhum motivo identificado.</div></div>`;
  }

  return items
    .map((item) => `
      <div class="clientCard">
        <div class="clientTitle">${escapeHtml(item.title)}</div>
        <div class="clientAction">${escapeHtml(item.acaoRecomendada)}</div>
      </div>
    `)
    .join("");
}

function renderClientGroups(items) {
  const groups = items.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const orderedGroups = ["Composição corporal", "Atividade", "Expectativa", "Outros"];

  return orderedGroups
    .filter((groupName) => groups[groupName] && groups[groupName].length)
    .map((groupName) => {
      const groupItems = groups[groupName].slice();
      return `
        <div class="reasonGroup">
          <div class="reasonGroupTitle">${escapeHtml(groupName)}</div>
          ${groupItems
            .map(
              (item) => `
                <div class="reasonItem">
                  <div class="reasonText">${escapeHtml(item.explicacaoCliente)}</div>
                  <div class="reasonAction">${escapeHtml(item.acaoRecomendada)}</div>
                </div>
              `
            )
            .join("")}
        </div>
      `;
    })
    .join("");
}

function renderReasonGroups(items) {
  const groups = items.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const orderedGroups = ["Composição corporal", "Atividade", "Expectativa", "Outros"];

  return orderedGroups
    .filter((groupName) => groups[groupName] && groups[groupName].length)
    .map((groupName) => {
      const groupItems = groups[groupName].slice().sort(sortExplainData);
      return `
        <div class="reasonGroup">
          <div class="reasonGroupTitle">${escapeHtml(groupName)}</div>
          ${renderReasonList(groupItems)}
        </div>
      `;
    })
    .join("");
}

function renderReportReasonList(items) {
  if (!items.length) {
    return `<div class="reportGroup"><div class="muted">Nenhum motivo identificado.</div></div>`;
  }

  return items
    .map((item) => {
      const impactoLabel = item.impacto === "—" ? "Impacto indisponível" : `Impacto: ${item.impacto}`;

      return `
        <div class="reportItem">
          <div class="reportBadgeRow">
            <span class="badge">${escapeHtml(impactoLabel)}</span>
            <span class="badge">${escapeHtml(item.code)}</span>
          </div>
          <div class="reasonText">${escapeHtml(item.explicacaoCliente)}</div>
          <div class="reasonAction">${escapeHtml(item.acaoRecomendada)}</div>
        </div>
      `;
    })
    .join("");
}

function renderReportGroups(items) {
  const groups = items.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const orderedGroups = ["Composição corporal", "Atividade", "Expectativa", "Outros"];

  return orderedGroups
    .filter((groupName) => groups[groupName] && groups[groupName].length)
    .map((groupName) => {
      const groupItems = groups[groupName].slice().sort(sortExplainData);
      return `
        <div class="reportGroup">
          <div class="reportGroupTitle">${escapeHtml(groupName)}</div>
          ${renderReportReasonList(groupItems)}
        </div>
      `;
    })
    .join("");
}

function renderDebugPayload(payload) {
  if (!els.result) return;

  let debugEl = document.getElementById("lm-debug");
  if (!debugEl) {
    debugEl = document.createElement("pre");
    debugEl.id = "lm-debug";
    debugEl.style.display = "none";
    try {
      els.result.appendChild(debugEl);
    } catch (error) {
      return;
    }
  }

  debugEl.textContent = JSON.stringify(payload, null, 2);
}

// -------------------------------
// Renderização (core -> UI)
// -------------------------------
function renderResult(result) {
  // Mostra card
  els.result.classList.remove("resultHidden");

  els.score.textContent = String(result.score);
  els.classification.textContent =
    currentMode === "debug"
      ? result.classification
      : mapClassificationToClientLabel(result.classification);
  if (els.versionLabel) {
    els.versionLabel.textContent = "LM Score v2.0.0";
  }
  if (els.resultDate) {
    els.resultDate.textContent = new Date().toLocaleDateString();
  }
  if (els.reportDate) {
    els.reportDate.textContent = new Date().toLocaleDateString();
  }
  if (els.reportFooterDate) {
    els.reportFooterDate.textContent = new Date().toLocaleDateString();
  }

  if (!Array.isArray(result?.reasons)) {
    console.warn("[LM] Result reasons is not an array:", result?.reasons);
  }
  const reasonsArray = Array.isArray(result?.reasons) ? result.reasons : [];
  const normalizedResult = { ...result, reasons: reasonsArray };

  // v1.1: texto educacional + principal fator
  els.mainFactor.textContent = buildEducationalText(normalizedResult);

  // Transparência: penalizações por bloco
  renderPenalties(normalizedResult);

  const explainItems = reasonsArray.map((reason, index) => buildExplainData(reason, index));
  const sortedExplainItems = explainItems.slice().sort(sortExplainData);
  const clientExplainItems = reasonsArray.map((reason, index) => buildClientExplainData(reason, index));
  const clientByIndex = clientExplainItems.reduce((acc, item) => {
    acc[item.index] = item;
    return acc;
  }, {});
  const sortedClientItems = sortedExplainItems.map((item) => clientByIndex[item.index]);

  if (els.topImpacts) {
    const topItems = sortedExplainItems.slice(0, 3);
    els.topImpacts.innerHTML = renderReasonList(topItems);
  }

  if (els.groupedReasons) {
    els.groupedReasons.innerHTML = renderReasonGroups(sortedExplainItems);
  }

  if (els.clientTopImpacts) {
    const topClient = sortedClientItems.slice(0, 3);
    els.clientTopImpacts.innerHTML = renderClientList(topClient);
  }

  if (els.clientGroupedReasons) {
    els.clientGroupedReasons.innerHTML = renderClientGroups(sortedClientItems);
  }

  if (els.reportScore) {
    els.reportScore.textContent = String(result.score);
  }
  if (els.reportClassification) {
    els.reportClassification.textContent =
      currentMode === "debug"
        ? result.classification
        : mapClassificationToClientLabel(result.classification);
  }
  if (els.reportTopImpacts) {
    const topItems = sortedExplainItems.slice(0, 3);
    els.reportTopImpacts.innerHTML = renderReportReasonList(topItems);
  }
  if (els.reportGroups) {
    els.reportGroups.innerHTML = renderReportGroups(sortedExplainItems);
  }

  const reasonSummary = extractReasonCodes(reasonsArray);
  const codeCounts = buildCodeHistogram(reasonSummary.codes);
  const debugPayload = {
    score: result.score,
    riskLabel: result.classification,
    codes: reasonSummary.codes,
    counts: codeCounts,
    version: result.version || "v1.6-ui-observability",
  };

  try {
    console.groupCollapsed("[LM] Debug payload");
    console.log(debugPayload);
    console.groupEnd();
  } catch (error) {
    // noop
  }

  renderDebugPayload({
    score: debugPayload.score,
    codes: debugPayload.codes,
    counts: debugPayload.counts,
  });

  // Debug completo (continua para QA)
  if (els.debug) {
    els.debug.textContent = JSON.stringify(result, null, 2);
  }
}

function renderResultSafe(result, allowRetry = true) {
  try {
    renderResult(result);
  } catch (error) {
    if (currentMode === "client" && allowRetry) {
      setUIMode("debug");
      renderResultSafe(result, false);
      return;
    }
    renderBootError();
  }
}
