import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import assert from "node:assert/strict"
import { fetchProviderModels } from "../model-catalog.mjs"
import { providerModelConfig } from "../provider-presets.mjs"

const rootPath = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]$/, "")

test("resolver prefers an explicit API key without printing diagnostics", () => {
  const result = execFileSync("node", [join(rootPath, "get-deepinfra-key.mjs")], {
    env: { ...process.env, DEEPINFRA_API_KEY: "test-key" },
    encoding: "utf8",
  })
  assert.equal(result, "test-key")
})

test("model discovery normalizes a provider catalog without exposing the key", async () => {
  let request
  const discovered = await fetchProviderModels(
    "openrouter",
    "catalog-secret",
    async (url, options) => {
      request = { url, options }
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "vendor/new-model",
              name: "New Model",
              context_length: 200000,
              max_completion_tokens: 16000,
              architecture: { input_modalities: ["text", "image"] },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )
    },
  )

  assert.equal(request.url, "https://openrouter.ai/api/v1/models")
  assert.equal(request.options.headers.authorization, "Bearer catalog-secret")
  assert.equal(discovered[0].id, "vendor/new-model")
  assert.equal(discovered[0].contextWindow, 200000)
  assert.deepEqual(discovered[0].input, ["text", "image"])
  assert.doesNotMatch(JSON.stringify(discovered), /catalog-secret/)

  const config = providerModelConfig(
    "openrouter",
    "/tmp/get-provider-key.mjs",
    discovered,
  )
  assert.ok(config.models.some((model) => model.id === "vendor/new-model"))
  assert.ok(config.models.some((model) => model.id === "deepseek/deepseek-chat-v3-0324:free"))
})

test("installer writes a custom Anthropic provider and DeepInfra aliases", () => {
  const tempHome = mkdtempSync(join(homedir(), ".omo-deepinfra-test-"))
  mkdirSync(join(tempHome, ".omo", "agent"), { recursive: true })
  writeFileSync(
    join(tempHome, ".omo", "agent", "settings.json"),
    JSON.stringify({ defaultProvider: "anthropic", defaultModel: "claude-opus" }),
  )
  writeFileSync(
    join(tempHome, ".omo", "omo.jsonc"),
    JSON.stringify({
      models: {
        grok: { model: "xai/grok-4.5" },
        fable: { model: "anthropic/claude-fable-5" },
        opus: { model: "anthropic/claude-opus-5-5" },
        astra: { model: "openai-codex/gpt-6-astra" },
        composer: { model: "cursor/composer-2.5" },
        kimi: { model: "opencode-go/kimi-k3" },
        router: { model: "openrouter/z-ai/glm-5.2" },
      },
    }),
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
  assert.equal(settings.defaultProvider, "deepinfra")
  assert.equal(settings.defaultModel, "deepseek-ai/DeepSeek-V4.1-Flash")
  assert.deepEqual(settings.recommendedModels, ["deepinfra/deepseek-ai/DeepSeek-V4.1-Flash"])
  const omoConfig = readFileSync(join(tempHome, ".omo", "omo.jsonc"), "utf8")
  assert.doesNotMatch(
    omoConfig,
    /(?:xai|anthropic|openai-codex|cursor|opencode-go|openrouter|vercel-ai-gateway)\//,
  )
  assert.match(omoConfig, /deepinfra\/deepseek-ai\/DeepSeek-V4\.1-Flash/)
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

test("router lists presets and switches provider without printing keys", () => {
  const tempHome = mkdtempSync(join(homedir(), ".omo-router-test-"))
  const agentDir = join(tempHome, "agent")
  mkdirSync(agentDir, { recursive: true })
  mkdirSync(join(tempHome, ".omo"), { recursive: true })
  writeFileSync(join(agentDir, "settings.json"), JSON.stringify({ theme: "dark" }))
  writeFileSync(
    join(tempHome, ".omo", "omo.jsonc"),
    JSON.stringify({ models: { fable: { model: "deepinfra/old-model" } } }),
  )
  const env = {
    ...process.env,
    OMO_DEEPINFRA_HOME: tempHome,
    OMO_CODING_AGENT_DIR: agentDir,
  }
  const listed = execFileSync("node", [join(rootPath, "provider-switch.mjs"), "list"], {
    env,
    encoding: "utf8",
  })
  assert.match(listed, /openrouter - OpenRouter/)
  assert.match(listed, /qwen-coder: Qwen\/Qwen3-Coder/)
  assert.match(listed, /opengateway - OpenGateway/)

  const switched = execFileSync(
    "node",
    [join(rootPath, "provider-switch.mjs"), "use", "together", "minimax"],
    { env, encoding: "utf8" },
  )
  assert.match(switched, /Active provider: together/)
  assert.doesNotMatch(switched, /secret|key-value|test-key/)

  const settings = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"))
  assert.equal(settings.theme, "dark")
  assert.equal(settings.defaultProvider, "together")
  assert.equal(settings.defaultModel, "MiniMaxAI/MiniMax-M3")
  const models = JSON.parse(readFileSync(join(agentDir, "models.json"), "utf8"))
  assert.equal(models.providers.together.baseUrl, "https://api.together.ai/v1")
  assert.match(models.providers.together.apiKey, /get-provider-key\.mjs/)
  assert.match(readFileSync(join(tempHome, ".omo", "omo.jsonc"), "utf8"), /together\/MiniMaxAI/)

  execFileSync(
    "node",
    [join(rootPath, "provider-switch.mjs"), "use", "opengateway", "gpt-4.1-mini"],
    { env, encoding: "utf8" },
  )
  const gatewayModels = JSON.parse(readFileSync(join(agentDir, "models.json"), "utf8"))
  assert.equal(gatewayModels.providers.opengateway.baseUrl, "https://apis.opengateway.ai/v1")
  assert.equal(
    gatewayModels.providers.opengateway.models[1].id,
    "openai/gpt-4.1-mini",
  )

  const keyOutput = execFileSync(
    "node",
    [join(rootPath, "provider-switch.mjs"), "key", "together"],
    {
      env: {
        ...env,
        TOGETHER_API_KEY: "do-not-print-this",
        OMO_MODEL_CATALOG_URL:
          "data:application/json,%7B%22data%22%3A%5B%7B%22id%22%3A%22vendor%2Fdiscovered%22%7D%5D%7D",
      },
      encoding: "utf8",
    },
  )
  assert.doesNotMatch(keyOutput, /do-not-print-this/)
  assert.equal(readFileSync(join(agentDir, "together-api-key"), "utf8"), "do-not-print-this\n")
  const synced = JSON.parse(readFileSync(join(agentDir, "models.json"), "utf8"))
  assert.ok(synced.providers.together.models.some((model) => model.id === "vendor/discovered"))
})
