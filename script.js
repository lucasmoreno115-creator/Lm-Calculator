// ===============================
// LM CALCULATOR — DEBUG CORE
// ===============================

document.getElementById("calcBtn").addEventListener("click", handleCalculate);

function handleCalculate() {
  const data = collectFormData();
  const result = runLMScore(data);
  renderResult(result);
}

// -------------------------------
// Coleta de dados
// -------------------------------
function collectFormData() {
  return {
    sex: document.getElementById("sex").value,
    age: Number(document.getElementById("age").value),
    weight: Number(document.getElementById("weight").value),
    height: Number(document.getElementById("height").value),
    bodyFat: Number(document.getElementById("bodyFat").value || 0),
    activity: document.getElementById("activityLevel").value,
    frequency: Number(document.getElementById("trainingFrequency").value),
    strength: document.getElementById("strengthTraining").checked,
    expectation: document.getElementById("expectation").value
  };
}

// -------------------------------
// LM Score (provisório)
// -------------------------------
function runLMScore(data) {
  let score = 100;
  let reasons = [];

  if (data.activity === "sedentary") {
    score -= 25;
    reasons.push("Sedentarismo reduz eficiência metabólica.");
  }

  if (data.frequency < 3) {
    score -= 15;
    reasons.push("Baixa frequência de treino.");
  }

  if (data.expectation === "fast") {
    score -= 20;
    reasons.push("Expectativa agressiva aumenta risco de frustração.");
  }

  if (score < 0) score = 0;

  return {
    score,
    classification:
      score >= 80 ? "Baixo risco metabólico" :
      score >= 50 ? "Risco metabólico moderado" :
      "Alto risco metabólico",
    reasons
  };
}

// -------------------------------
// Renderização
// -------------------------------
function renderResult(result) {
  document.getElementById("result").style.display = "block";

  document.getElementById("score").textContent =
    `LM Score: ${result.score}`;

  document.getElementById("classification").textContent =
    result.classification;

  document.getElementById("mainFactor").textContent =
    result.reasons.join(" ");

  document.getElementById("debug").textContent =
    JSON.stringify(result, null, 2);
}
