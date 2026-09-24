# omo-router

Provider switching and automatic model discovery for the native OMO/Senpi
harness.

`omo-router` writes the supported OMO custom-provider files under
`~/.omo/agent`. It does not patch OMO internals, copy API keys into the
repository, or require CC Switch.

## Requirements

- Node.js 22 or newer
- OMO native (`omo`)
- An API key for the provider you want to use

## Install and first setup

Install the published CLI globally:

```sh
npm install --global omo-router
```

Or run it without a global install:

```sh
npx --yes omo-router@0.1.3 --help
```

If you are inside this source checkout, run `npx` from another directory
because the checkout itself is named `omo-router`. For example:

```sh
cd ~
npx --yes omo-router@0.1.3 list
```

The CLI creates timestamped backups before changing:

- `~/.omo/agent/models.json`
- `~/.omo/agent/settings.json`
- `~/.omo/omo.jsonc`

## Configure a provider

Set the API key in the current shell and store it in the OMO agent directory.
The file is written with restricted permissions and the value is never
printed.

### DeepInfra

```sh
export DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
```

DeepInfra presets:

- `deepseek-flash`
- `deepseek-pro`
- `qwen-coder`

DeepInfra uses its Anthropic-compatible endpoint:
`https://api.deepinfra.com/anthropic`.

### OpenRouter

```sh
export OPENROUTER_API_KEY="sk-or-v1-..."
omo-router key openrouter
omo-router use openrouter deepseek-free
```

OpenRouter presets:

- `deepseek-free`
- `qwen-coder`

### Together AI

```sh
export TOGETHER_API_KEY="your-together-key"
omo-router key together
omo-router use together minimax
```

### Groq

```sh
export GROQ_API_KEY="your-groq-key"
omo-router key groq
omo-router use groq llama
```

### OpenGateway

```sh
export OPENGATEWAY_API_KEY="your-opengateway-key"
omo-router key opengateway
omo-router use opengateway deepseek-fast
```

OpenGateway uses `https://apis.opengateway.ai/v1`.

## Automatic model discovery

When `key <provider>` succeeds, `omo-router` requests that provider's
official `/models` catalog and merges the available models into OMO's
`models.json`. Existing curated presets are preserved.

Refresh a provider later:

```sh
omo-router sync openrouter
omo-router sync deepinfra
```

The catalog request uses the key only in an `Authorization: Bearer` header.
The key is not written to `models.json`, printed, or committed.

## Select models inside OMO

Register the provider once, then start OMO:

```sh
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
omo
```

Inside OMO, open the model picker:

```text
/model
```

Discovered and curated models are available there. You can also inspect the
active default from the shell:

```sh
omo-router list
omo-router current
```

To set a model that is not a curated preset:

```sh
omo-router use openrouter --model deepseek/deepseek-r1
```

## CLI reference

```text
omo-router list
omo-router current
omo-router key <provider>
omo-router sync <provider>
omo-router use <provider> [preset]
omo-router use <provider> --model <provider-model-id>
```

`use` changes the OMO default provider/model and direct model aliases. A
per-command `omo --model ...` argument still takes precedence.

## Security and backups

- API keys are stored outside the repository under `~/.omo/agent`.
- Key files use mode `0600` where the platform supports it.
- Request-time resolvers read the key only when OMO sends a request.
- Every mutation creates a timestamped `.bak-provider-*` backup.
- Never put a real key in shell history, README files, tests, or git.

## Development

```sh
npm test
node --check provider-switch.mjs
node --check model-catalog.mjs
```

The test suite covers provider switching, catalog normalization, automatic
registration, backup behavior, and key non-disclosure.

## License

Add the project license before distributing this package.
