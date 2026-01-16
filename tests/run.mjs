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

function assertWithin(name, actual, expected, tolerance) {
  const min = expected - tolerance;
  const max = expected + tolerance;

  if (actual < min || actual > max) {
    throw new Error(
      `[FAIL] ${name}: score=${actual} (expected ${expected} ±${tolerance} => ${min}..${max})`
    );
  }
  console.log(`[PASS] ${name}: score=${actual} (expected ${expected} ±${tolerance})`);
}

function assertReasonsNonEmptyWhenLow(name, result) {
  // Se score < 85, precisa explicar (educacional)
  if (result.score < 85 && (!Array.isArray(result.reasons) || result.reasons.length === 0)) {
    throw new Error(`[FAIL] ${name}: score < 85 mas reasons está vazio`);
  }
  console.log(`[PASS] ${name}: reasons ok (${result.reasons.length})`);
}

function runScenario(file, label) {
  const input = readJson(file);
  const result = calculateLMScore(input);
  return { label, result };
}

function main() {
  const expected = {
    scenarioA: { score: 50, tolerance: 2 },
    scenarioB: { score: 95, tolerance: 2 },
    scenarioC: { score: 80, tolerance: 2 }
  };

  const cases = [
    { file: "scenarioA.json", key: "scenarioA", label: "Scenario A" },
    { file: "scenarioB.json", key: "scenarioB", label: "Scenario B" },
    { file: "scenarioC.json", key: "scenarioC", label: "Scenario C" }
  ];

  let failures = 0;

  for (const c of cases) {
    try {
      const { result, label } = runScenario(c.file, c.label);
      const exp = expected[c.key];

      assertWithin(label, result.score, exp.score, exp.tolerance);
      assertReasonsNonEmptyWhenLow(label, result);
    } catch (e) {
      failures++;
      console.error(String(e?.message || e));
    }
  }

  if (failures) {
    console.error(`\n${failures} teste(s) falharam.`);
    process.exit(1);
  }

  console.log("\nTodos os testes passaram ✅");
}

main();
