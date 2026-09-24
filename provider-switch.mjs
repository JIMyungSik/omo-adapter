#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import {
  getModel,
  getProvider,
  providerModelConfig,
  PROVIDER_PRESETS,
} from "./provider-presets.mjs"
import { fetchProviderModels } from "./model-catalog.mjs"

const home = process.env.OMO_DEEPINFRA_HOME || homedir()
const agentDir = process.env.OMO_CODING_AGENT_DIR || join(home, ".omo", "agent")
const modelsPath = join(agentDir, "models.json")
const settingsPath = join(agentDir, "settings.json")
const omoConfig = join(home, ".omo", "omo.jsonc")
const packageDir = fileURLToPath(new URL(".", import.meta.url))
const resolverPath = join(packageDir, "get-provider-key.mjs")
const deepinfraResolver = join(packageDir, "get-deepinfra-key.mjs")
const packageVersion = JSON.parse(
  readFileSync(join(packageDir, "package.json"), "utf8"),
).version
const stamp = new Date().toISOString().replaceAll(/[-:.TZ]/g, "").slice(0, 14)

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback
  return JSON.parse(readFileSync(path, "utf8"))
}

function backup(path) {
  if (existsSync(path)) copyFileSync(path, `${path}.bak-provider-${stamp}`)
}

function usage() {
console.log(`Usage:
  omo-router list
  omo-router current
  omo-router key <provider>
  omo-router sync <provider>
  omo-router use <provider> [preset]
  omo-router use <provider> --model <model-id>
`)
}

function version() {
  console.log(`omo-router ${packageVersion}`)
}

function list() {
  for (const [provider, config] of Object.entries(PROVIDER_PRESETS)) {
    console.log(`${provider} - ${config.label}`)
    for (const [preset, model] of Object.entries(config.models)) {
      const marker = preset === config.defaultPreset ? " (default)" : ""
      console.log(`  ${preset}${marker}: ${model.id}`)
    }
  }
}

function current() {
  const settings = readJson(settingsPath, {})
  console.log(
    JSON.stringify(
      {
        provider: settings.defaultProvider || null,
        model: settings.defaultModel || null,
      },
      null,
      2,
    ),
  )
}

function storeKey(provider) {
  const config = getProvider(provider)
  const key = process.env[config.envKey]?.trim()
  if (!key) {
    console.error(`Set ${config.envKey} before running "omo-router key ${provider}".`)
    process.exitCode = 1
    return
  }
  mkdirSync(agentDir, { recursive: true })
  const keyPath = join(agentDir, `${provider}-api-key`)
  writeFileSync(keyPath, `${key}\n`, { encoding: "utf8", mode: 0o600 })
  console.log(`Stored ${provider} key at ${keyPath}`)
  return syncProviderModels(provider, key)
}

async function syncProviderModels(provider, key) {
  const discovered = await fetchProviderModels(provider, key)
  const models = readJson(modelsPath, {})
  models.providers = models.providers || {}
  backup(modelsPath)
  models.providers[provider] = providerModelConfig(
    provider,
    provider === "deepinfra" ? deepinfraResolver : resolverPath,
    [...(models.providers[provider]?.models || []), ...discovered],
  )
  writeFileSync(modelsPath, `${JSON.stringify(models, null, 2)}\n`, "utf8")
  console.log(`Registered ${discovered.length} models for ${provider}`)
}

function updateAliases(text, target) {
  return text.replace(
    /("model"\s*:\s*)"(?:deepinfra|xai|anthropic|openai-codex|cursor|opencode-go|openrouter|vercel-ai-gateway)\/[^"]+"/g,
    `$1"${target}"`,
  )
}

function useProvider(provider, preset, modelId) {
  const config = getProvider(provider)
  const model = getModel(provider, preset, modelId)
  mkdirSync(agentDir, { recursive: true })
  backup(modelsPath)
  backup(settingsPath)
  backup(omoConfig)

  const models = readJson(modelsPath, {})
  models.providers = models.providers || {}
  models.providers[provider] = providerModelConfig(
    provider,
    provider === "deepinfra" ? deepinfraResolver : resolverPath,
    models.providers[provider]?.models || [],
  )
  writeFileSync(modelsPath, `${JSON.stringify(models, null, 2)}\n`, "utf8")

  const settings = readJson(settingsPath, {})
  settings.defaultProvider = provider
  settings.defaultModel = model.id
  settings.recommendedModels = [`${provider}/${model.id}`]
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8")

  if (existsSync(omoConfig)) {
    const currentText = readFileSync(omoConfig, "utf8")
    writeFileSync(omoConfig, updateAliases(currentText, `${provider}/${model.id}`), "utf8")
  }

  console.log(`Active provider: ${provider} (${config.label})`)
  console.log(`Active model: ${model.id}`)
  console.log(`Saved backups with suffix .bak-provider-${stamp}`)
}

const [command, provider, ...rest] = process.argv.slice(2)

async function main() {
  if (command === "--version" || command === "-v" || command === "version") {
    version()
  } else if (!command || command === "--help" || command === "-h" || command === "help") {
    usage()
  } else if (command === "list") {
    list()
  } else if (command === "current") {
    current()
  } else if (command === "key") {
    try {
      await storeKey(provider)
    } catch (error) {
      console.error(`Stored ${provider} key, but model discovery failed: ${error.message}`)
      process.exitCode = 1
    }
  } else if (command === "sync") {
    const keyPath = join(agentDir, `${provider}-api-key`)
    try {
      const config = getProvider(provider)
      const key = process.env[config.envKey] ||
        (existsSync(keyPath) ? readFileSync(keyPath, "utf8").trim() : "")
      if (!key) throw new Error(`${config.envKey} not found`)
      await syncProviderModels(provider, key)
    } catch (error) {
      console.error(`Model discovery failed: ${error.message}`)
      process.exitCode = 1
    }
  } else if (command === "use") {
    const modelFlag = rest.indexOf("--model")
    const modelId = modelFlag >= 0 ? rest[modelFlag + 1] : undefined
    const preset = modelFlag >= 0 ? undefined : rest[0]
    if (!provider) {
      usage()
      process.exitCode = 1
    } else {
      useProvider(provider, preset, modelId)
    }
  } else {
    console.error(`Unknown command: ${command}`)
    usage()
    process.exitCode = 1
  }
}

try {
  await main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Error: ${message}`)
  process.exitCode = 1
}
