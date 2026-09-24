const deepinfraModels = [
  {
    id: "deepseek-ai/DeepSeek-V4.1-Flash",
    name: "DeepSeek V4.1 Flash (DeepInfra)",
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 1000000,
    maxTokens: 128000,
  },
  {
    id: "deepseek-ai/DeepSeek-V4-Pro",
    name: "DeepSeek V4 Pro (DeepInfra)",
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 1000000,
    maxTokens: 128000,
  },
  {
    id: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
    name: "Qwen3 Coder 480B (DeepInfra)",
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 262144,
    maxTokens: 32768,
  },
]

const openAiModel = (id, name, contextWindow = 128000) => ({
  id,
  name,
  reasoning: true,
  input: ["text"],
  contextWindow,
  maxTokens: 32768,
})

export const PROVIDER_PRESETS = {
  deepinfra: {
    label: "DeepInfra",
    api: "anthropic-messages",
    baseUrl: "https://api.deepinfra.com/anthropic",
    catalogUrl: "https://api.deepinfra.com/v1/models",
    envKey: "DEEPINFRA_API_KEY",
    defaultPreset: "deepseek-flash",
    models: {
      "deepseek-flash": deepinfraModels[0],
      "deepseek-pro": deepinfraModels[1],
      "qwen-coder": deepinfraModels[2],
    },
  },
  openrouter: {
    label: "OpenRouter",
    api: "openai-completions",
    baseUrl: "https://openrouter.ai/api/v1",
    catalogUrl: "https://openrouter.ai/api/v1/models",
    envKey: "OPENROUTER_API_KEY",
    defaultPreset: "deepseek-free",
    models: {
      "deepseek-free": openAiModel(
        "deepseek/deepseek-chat-v3-0324:free",
        "DeepSeek Chat V3 (OpenRouter)",
      ),
      "qwen-coder": openAiModel(
        "qwen/qwen3-coder",
        "Qwen3 Coder (OpenRouter)",
      ),
    },
  },
  together: {
    label: "Together AI",
    api: "openai-completions",
    baseUrl: "https://api.together.ai/v1",
    catalogUrl: "https://api.together.ai/v1/models",
    envKey: "TOGETHER_API_KEY",
    defaultPreset: "minimax",
    models: {
      minimax: openAiModel("MiniMaxAI/MiniMax-M3", "MiniMax M3 (Together)"),
      llama: openAiModel(
        "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        "Llama 3.3 70B (Together)",
      ),
    },
  },
  groq: {
    label: "Groq",
    api: "openai-completions",
    baseUrl: "https://api.groq.com/openai/v1",
    catalogUrl: "https://api.groq.com/openai/v1/models",
    envKey: "GROQ_API_KEY",
    defaultPreset: "llama",
    models: {
      llama: openAiModel("llama-3.3-70b-versatile", "Llama 3.3 70B (Groq)"),
      "gpt-oss": openAiModel("openai/gpt-oss-120b", "GPT-OSS 120B (Groq)"),
    },
  },
  opengateway: {
    label: "OpenGateway",
    api: "openai-completions",
    baseUrl: "https://apis.opengateway.ai/v1",
    catalogUrl: "https://apis.opengateway.ai/v1/models",
    envKey: "OPENGATEWAY_API_KEY",
    defaultPreset: "deepseek-fast",
    models: {
      "deepseek-fast": openAiModel(
        "deepseek/deepseek-v4.1-flash-ultrafast",
        "DeepSeek V4.1 Flash Ultrafast (OpenGateway)",
        1000000,
      ),
      "gpt-4.1-mini": openAiModel(
        "openai/gpt-4.1-mini",
        "GPT-4.1 Mini (OpenGateway)",
        1047576,
      ),
      "claude-sonnet": openAiModel(
        "anthropic/claude-sonnet-4-6",
        "Claude Sonnet 4.6 (OpenGateway)",
        1000000,
      ),
    },
  },
}

export function getProvider(provider) {
  const config = PROVIDER_PRESETS[provider]
  if (!config) throw new Error(`Unknown provider: ${provider}`)
  return config
}

export function getModel(provider, preset = undefined, modelId = undefined) {
  const config = getProvider(provider)
  if (modelId) {
    return {
      id: modelId,
      name: `${modelId} (${config.label})`,
      reasoning: true,
      input: ["text"],
      contextWindow: 128000,
      maxTokens: 32768,
    }
  }
  const selected = config.models[preset || config.defaultPreset]
  if (!selected) {
    throw new Error(
      `Unknown preset "${preset}". Available: ${Object.keys(config.models).join(", ")}`,
    )
  }
  return selected
}

export function providerModelConfig(provider, resolverPath, existingModels = []) {
  const config = getProvider(provider)
  const curatedModels = Object.values(config.models)
  const modelsById = new Map(
    [...curatedModels, ...existingModels].map((model) => [model.id, model]),
  )
  const models = [...modelsById.values()].map((model) => ({
    ...model,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  }))
  const apiKey = `!node "${resolverPath.replaceAll("\\", "/")}"`
  return {
    baseUrl: config.baseUrl,
    api: config.api,
    apiKey,
    models,
  }
}
