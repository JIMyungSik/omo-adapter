import { getProvider } from "./provider-presets.mjs"

function firstNumber(...values) {
  return values.find((value) => Number.isFinite(value) && value > 0) || 128000
}

function normalizeModel(raw) {
  if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !raw.id) {
    return null
  }
  const modalities = raw.architecture?.input_modalities || raw.modalities?.input || ["text"]
  return {
    id: raw.id,
    name: raw.name || raw.display_name || raw.id,
    reasoning: true,
    input: Array.isArray(modalities) && modalities.length > 0 ? modalities : ["text"],
    contextWindow: firstNumber(
      raw.context_window,
      raw.context_length,
      raw.max_context_length,
    ),
    maxTokens: firstNumber(
      raw.max_output_tokens,
      raw.max_completion_tokens,
      raw.max_tokens,
      32768,
    ),
  }
}

export async function fetchProviderModels(provider, apiKey, fetchImpl = fetch) {
  const config = getProvider(provider)
  const catalogUrl = process.env.OMO_MODEL_CATALOG_URL || config.catalogUrl
  const response = await fetchImpl(catalogUrl, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Model catalog request failed with HTTP ${response.status}`)
  }
  const payload = await response.json()
  const candidates = Array.isArray(payload) ? payload : payload.data || payload.models
  if (!Array.isArray(candidates)) {
    throw new Error("Model catalog response did not contain a model list")
  }
  return candidates.map(normalizeModel).filter(Boolean)
}
