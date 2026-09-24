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
import {
  getModel,
  getProvider,
  providerModelConfig,
  PROVIDER_PRESETS,
} from "./provider-presets.mjs"

const home = process.env.OMO_DEEPINFRA_HOME || homedir()
const agentDir = process.env.OMO_CODING_AGENT_DIR || join(home, ".omo", "agent")
const modelsPath = join(agentDir, "models.json")
const settingsPath = join(agentDir, "settings.json")
const omoConfig = join(home, ".omo", "omo.jsonc")
const resolverPath = join(process.cwd(), "get-provider-key.mjs")
const deepinfraResolver = join(process.cwd(), "get-deepinfra-key.mjs")
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
  omo-provider list
  omo-provider current
  omo-provider key <provider>
  omo-provider use <provider> [preset]
  omo-provider use <provider> --model <model-id>
`)
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
    console.error(`Set ${config.envKey} before running "omo-provider key ${provider}".`)
    process.exitCode = 1
    return
  }
  mkdirSync(agentDir, { recursive: true })
  const keyPath = join(agentDir, `${provider}-api-key`)
  writeFileSync(keyPath, `${key}\n`, { encoding: "utf8", mode: 0o600 })
  console.log(`Stored ${provider} key at ${keyPath}`)
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
if (!command || command === "--help" || command === "-h") {
  usage()
} else if (command === "list") {
  list()
} else if (command === "current") {
  current()
} else if (command === "key") {
  storeKey(provider)
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
