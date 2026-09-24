# OMO DeepInfra Adapter

Cross-platform DeepInfra provider setup for the native `omo` / Senpi harness.

This adapter uses Senpi's supported `~/.omo/agent/models.json` custom-provider
configuration. It does not patch OMO internals and does not copy API keys into
the repository.

## What it does

- Registers a curated set of DeepSeek, Qwen Coder, and GLM models.
- Uses DeepInfra's Anthropic Messages-compatible endpoint.
- Reads an existing CC Switch `DeepInfra DeepSeek` token locally at request time.
- Routes every direct OMO model alias and the native default to DeepInfra, so
  Anthropic OAuth, xAI quota, and other provider credentials cannot enter the
  request path.
- Supports macOS, Linux, and Windows path conventions.

## Install

Requirements:

- Node.js 22 or newer
- OMO native (`omo`)
- `DEEPINFRA_API_KEY`, a configured local key, or CC Switch with an active
  `DeepInfra DeepSeek` provider

Run from this repository:

```sh
node install.mjs
```

The installer does not ask for an API key. Configure it afterward:

```sh
# macOS/Linux
DEEPINFRA_API_KEY="your-key" npx omo-deepinfra-setup

# Windows PowerShell
$env:DEEPINFRA_API_KEY = "your-key"
npx omo-deepinfra-setup
```

The setup command stores the key in the local OMO agent directory with
restricted permissions. It never prints or uploads the key.

The installer creates timestamped backups before changing:

- `~/.omo/agent/models.json`
- `~/.omo/omo.jsonc`
- `~/.omo/agent/settings.json` (only the native default provider/model)

It never writes a key into this repository. The request-time resolver only
prints the key to the provider process's stdout.

## Manual verification

```sh
omo --list-models deepinfra
omo auth check --provider deepinfra --no-refresh --json
omo --model deepinfra/deepseek-ai/DeepSeek-V4.1-Flash -p "Reply DEEPINFRA_OK"
omo --model deepinfra/Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo -p "Reply QWEN_OK"
```

The resolver supports:

- macOS/Linux: `~/.cc-switch/cc-switch.db`
- Windows: `%APPDATA%/cc-switch/cc-switch.db` and `%USERPROFILE%/.cc-switch/cc-switch.db`
- `CC_SWITCH_DB` override
- `DEEPINFRA_API_KEY` override

No Anthropic OAuth refresh is used for the DeepInfra provider.

The catalog is intentionally curated rather than copied wholesale from
DeepInfra's changing model list. Add or remove entries in `install.mjs`, then
rerun the installer. OMO model selection uses the normal
`deepinfra/<model-id>` form.
