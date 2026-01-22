import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { calculateLMScore } from "../core/lmScoreEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJson(file) {
  const full = path.join(__dirname, file);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function assertContractScore(label, result) {
  const isNumber = typeof result.score === "number";
  const isFinite = Number.isFinite(result.score);
  const inRange = result.score >= 40 && result.score <= 100;

  if (!isNumber || !isFinite || !inRange) {
    throw new Error(
      `[FAIL] ${label}: score contract inválido (score=${result.score})`
    );
  }

  console.log(`[PASS] ${label}: score contract ok (${result.score})`);
}

function assertContractReasons(label, result) {
  if (!Array.isArray(result.reasons)) {
    throw new Error(`[FAIL] ${label}: reasons não é array`);
  }

  result.reasons.forEach((reason, index) => {
    if (reason && typeof reason === "object") {
      const hasCode = typeof reason.code === "string" && reason.code.length > 0;
      const hasMessage =
        typeof reason.message === "string" && reason.message.length > 0;

      if (!hasCode || !hasMessage) {
        throw new Error(
          `[FAIL] ${label}: reason[${index}] objeto inválido (code/message)`
        );
      }
      return;
    }

    throw new Error(`[FAIL] ${label}: reason[${index}] tipo inválido`);
  });

  console.log(`[PASS] ${label}: reasons contract ok (${result.reasons.length})`);
}

function runScenario(file, label) {
  const input = readJson(file);
  const result = calculateLMScore(input);
  return { label, result };
}

export function runContractTests() {
  const cases = [
    { file: "scenarioA.json", label: "Scenario A" },
    { file: "scenarioB.json", label: "Scenario B" },
    { file: "scenarioC.json", label: "Scenario C" },
  ];

  let failures = 0;

  for (const c of cases) {
    try {
      const { result, label } = runScenario(c.file, c.label);
      assertContractScore(label, result);
      assertContractReasons(label, result);
    } catch (e) {
      failures++;
      console.error(String(e?.message || e));
    }
  }

  if (failures) {
    console.error(`\n${failures} teste(s) de contrato falharam.`);
  } else {
    console.log("\nTodos os testes de contrato passaram ✅");
  }

  return failures;
}
