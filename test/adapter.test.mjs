import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import assert from "node:assert/strict"

const rootPath = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]$/, "")

test("resolver prefers an explicit API key without printing diagnostics", () => {
  const result = execFileSync("node", [join(rootPath, "get-deepinfra-key.mjs")], {
    env: { ...process.env, DEEPINFRA_API_KEY: "test-key" },
    encoding: "utf8",
  })
  assert.equal(result, "test-key")
})

test("installer writes a custom Anthropic provider and xAI fallback aliases", () => {
  const tempHome = mkdtempSync(join(homedir(), ".omo-deepinfra-test-"))
  mkdirSync(join(tempHome, ".omo", "agent"), { recursive: true })
  writeFileSync(
    join(tempHome, ".omo", "agent", "settings.json"),
    JSON.stringify({ defaultProvider: "anthropic", defaultModel: "claude-opus" }),
  )
  execFileSync("node", [join(rootPath, "install.mjs")], {
    cwd: rootPath,
    env: {
      ...process.env,
      OMO_DEEPINFRA_HOME: tempHome,
      OMO_CODING_AGENT_DIR: join(tempHome, ".omo", "agent"),
    },
    encoding: "utf8",
  })

  const models = JSON.parse(readFileSync(join(tempHome, ".omo", "agent", "models.json"), "utf8"))
  assert.equal(models.providers.deepinfra.baseUrl, "https://api.deepinfra.com/anthropic")
  assert.equal(models.providers.deepinfra.api, "anthropic-messages")
  assert.match(models.providers.deepinfra.apiKey, /^!node "/)
  assert.equal(models.providers.deepinfra.models[0].id, "deepseek-ai/DeepSeek-V4.1-Flash")
  assert.ok(models.providers.deepinfra.models.length >= 5)
  assert.ok(
    models.providers.deepinfra.models.some(
      (model) => model.id === "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
    ),
  )
  const settings = JSON.parse(
    readFileSync(join(tempHome, ".omo", "agent", "settings.json"), "utf8"),
  )
  assert.equal(settings.defaultProvider, "xai")
  assert.equal(settings.defaultModel, "grok-4.5")
})

test("setup stores a key outside the package tree", () => {
  const tempHome = mkdtempSync(join(homedir(), ".omo-deepinfra-setup-test-"))
  execFileSync("node", [join(rootPath, "setup.mjs")], {
    env: {
      ...process.env,
      OMO_DEEPINFRA_HOME: tempHome,
      OMO_CODING_AGENT_DIR: join(tempHome, "agent"),
      DEEPINFRA_API_KEY: "setup-test-key",
    },
    encoding: "utf8",
  })
  assert.equal(readFileSync(join(tempHome, "agent", "deepinfra-api-key"), "utf8"), "setup-test-key\n")
})
