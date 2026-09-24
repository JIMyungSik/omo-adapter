import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir, platform } from "node:os"
import { join } from "node:path"

const home = process.env.OMO_DEEPINFRA_HOME || homedir()
const agentDir = process.env.OMO_CODING_AGENT_DIR || join(home, ".omo", "agent")
const omoConfig = join(home, ".omo", "omo.jsonc")
const settingsPath = join(agentDir, "settings.json")
const modelsPath = join(agentDir, "models.json")
const resolverPath = join(process.cwd(), "get-deepinfra-key.mjs")
const stamp = new Date().toISOString().replaceAll(/[-:.TZ]/g, "").slice(0, 14)

mkdirSync(agentDir, { recursive: true })

function backup(path) {
  if (existsSync(path)) copyFileSync(path, `${path}.bak-deepinfra-${stamp}`)
}

function commandPath(path) {
  return `"${path.replaceAll("\\", "/")}"`
}

backup(modelsPath)
backup(omoConfig)
backup(settingsPath)

const models = {
  providers: {
    deepinfra: {
      baseUrl: "https://api.deepinfra.com/anthropic",
      api: "anthropic-messages",
      apiKey: `!node ${commandPath(resolverPath)}`,
      models: [
        ["deepseek-ai/DeepSeek-V4.1-Flash", "DeepSeek V4.1 Flash", 1000000, 128000],
        ["deepseek-ai/DeepSeek-V4-Flash", "DeepSeek V4 Flash", 1000000, 128000],
        ["deepseek-ai/DeepSeek-V4-Pro", "DeepSeek V4 Pro", 1000000, 128000],
        [
          "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
          "Qwen3 Coder 480B",
          262144,
          32768,
        ],
        ["zai-org/GLM-4.7", "GLM 4.7", 200000, 32768],
      ].map(([id, name, contextWindow, maxTokens]) => ({
        id,
        name: `${name} (DeepInfra)`,
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow,
        maxTokens,
      })),
    },
  },
}
writeFileSync(modelsPath, `${JSON.stringify(models, null, 2)}\n`, "utf8")

if (existsSync(settingsPath)) {
  const settings = JSON.parse(readFileSync(settingsPath, "utf8"))
  settings.defaultProvider = "deepinfra"
  settings.defaultModel = "deepseek-ai/DeepSeek-V4.1-Flash"
  settings.recommendedModels = ["deepinfra/deepseek-ai/DeepSeek-V4.1-Flash"]
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8")
}

if (existsSync(omoConfig)) {
  let text = readFileSync(omoConfig, "utf8")
  text = text.replace(
    /("fable"\s*:\s*\{\s*"model"\s*:\s*)"anthropic\/[^"]+"/,
    '$1"xai/grok-4.5"',
  )
  text = text.replace(
    /("fable-high"\s*:\s*\{\s*"model"\s*:\s*)"anthropic\/[^"]+"/,
    '$1"xai/grok-4.5"',
  )
  text = text.replace(
    /("fable-med"\s*:\s*\{\s*"model"\s*:\s*)"anthropic\/[^"]+"/,
    '$1"xai/grok-4.5"',
  )
  text = text.replace(
    /("opus"\s*:\s*\{\s*"model"\s*:\s*)"anthropic\/[^"]+"/,
    '$1"xai/grok-4.5"',
  )
  text = text.replace(
    /("opus-xhigh"\s*:\s*\{\s*"model"\s*:\s*)"anthropic\/[^"]+"/,
    '$1"xai/grok-4.5"',
  )
  writeFileSync(omoConfig, text, "utf8")
}

console.log(`Installed DeepInfra provider for ${platform()}`)
console.log(`models: ${modelsPath}`)
console.log(`resolver: ${resolverPath}`)
console.log("Fable/Opus aliases now use xai/grok-4.5")
console.log("OMO native default now uses deepinfra/deepseek-ai/DeepSeek-V4.1-Flash")
