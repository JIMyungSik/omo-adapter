# OMO Router

Cross-platform provider switching and model presets for the native `omo` /
Senpi harness.

The router uses Senpi's supported `~/.omo/agent/models.json` custom-provider
configuration. It does not patch OMO internals or copy API keys into the
repository.

## What it does

- Registers curated presets for DeepInfra, OpenRouter, Together AI, and Groq.
- Uses each provider's documented Anthropic-compatible or OpenAI-compatible
  endpoint.
- Reads keys at request time from environment variables or local 0600 files.
- Switches OMO's active provider/model and direct aliases without changing
  unrelated settings.
- Supports macOS, Linux, and Windows path conventions.

## Install

Requirements:

- Node.js 22 or newer
- OMO native (`omo`)

Install the native DeepInfra provider and create backups:

```sh
node install.mjs
```

Configure a key after installation:

```sh
# macOS/Linux
DEEPINFRA_API_KEY="your-key" npx omo-router key deepinfra

# Windows PowerShell
$env:DEEPINFRA_API_KEY = "your-key"
npx omo-router key deepinfra
```

The key command stores the key in the local OMO agent directory with
restricted permissions. It never prints or uploads the key.

The installer creates timestamped backups before changing:

- `~/.omo/agent/models.json`
- `~/.omo/omo.jsonc`
- `~/.omo/agent/settings.json`

## Provider switching and model presets

```sh
npx omo-router list
npx omo-router use deepinfra qwen-coder
npx omo-router use openrouter deepseek-free
npx omo-router use together minimax
npx omo-router use groq llama
npx omo-router current
```

Use a model not in the curated catalog with:

```sh
npx omo-router use openrouter --model provider/model-id
```

The current default is DeepInfra. OpenRouter, Together AI, and Groq are
opt-in presets and require their own API keys.

## Manual verification

```sh
omo --list-models deepinfra
omo auth check --provider deepinfra --no-refresh --json
omo --model deepinfra/deepseek-ai/DeepSeek-V4.1-Flash -p "Reply DEEPINFRA_OK"
omo --model deepinfra/Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo -p "Reply QWEN_OK"
```

DeepInfra also reads an existing CC Switch `DeepInfra DeepSeek` token locally
at request time. Supported overrides include `CC_SWITCH_DB` and
`DEEPINFRA_API_KEY`.

No Anthropic OAuth refresh is used for the DeepInfra provider.
