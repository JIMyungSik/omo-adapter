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
npx --yes omo-router@0.1.5 --help
```

If you are inside this source checkout, run `npx` from another directory
because the checkout itself is named `omo-router`. For example:

```sh
cd ~
npx --yes omo-router@0.1.5 list
```

The CLI creates timestamped backups before changing:

- `~/.omo/agent/models.json`
- `~/.omo/agent/settings.json`
- `~/.omo/omo.jsonc`

## Windows and Linux command rules

Run each command on its own line. Do not paste two commands together without a
newline or command separator. If you accidentally concatenate commands,
`deepseek-flashomo-router` is treated as one invalid preset name.

### Windows PowerShell

```powershell
$env:DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
```

### Windows Command Prompt

```cmd
set DEEPINFRA_API_KEY=your-deepinfra-key
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
```

### Linux Bash and WSL

```bash
export DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
```

PowerShell uses `$env:NAME`; Bash uses `export NAME`. WSL follows the Linux
Bash instructions and has its own Node/npm installation.

## Windows quick start

Run these PowerShell commands one at a time:

```powershell
node --version
npm install --global omo-router@0.1.5
omo-router --help
$env:DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
omo-router current
omo
```

If OMO is already running, exit and start it again before opening `/model`.
You can use `npx` instead of a global install:

```powershell
npx --yes omo-router@0.1.5 list
npx --yes omo-router@0.1.5 key deepinfra
npx --yes omo-router@0.1.5 use deepinfra deepseek-flash
```

## Linux quick start

Run these Bash commands one at a time:

```bash
node --version
npm install --global omo-router@0.1.5
omo-router --help
export DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
omo-router current
omo
```

For long-term use, storing the key with `omo-router key deepinfra` and then
clearing the shell variable is safer than putting a real key in shell profiles.

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

If OMO is already running, exit and start it again after `key`, `sync`, or
`use`. OMO reads the updated provider and model files at startup; restarting
ensures the `/model` picker shows the new catalog and the new default.

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

## Troubleshooting

### `Unknown preset "deepseek-flashomo-router"`

Two commands were pasted together. Run them separately:

```powershell
omo-router use deepinfra deepseek-flash
omo-router current
```

### `omo-router` is not recognized

Install the global CLI and check its location:

```powershell
npm install --global omo-router@0.1.5
where.exe omo-router
```

On Linux:

```bash
npm install --global omo-router@0.1.5
which omo-router
```

### A model is missing from `/model`

Refresh the provider catalog and restart OMO:

```powershell
omo-router sync deepinfra
```

### `DEEPINFRA_API_KEY not found`

Set the variable in the same shell that runs the command:

PowerShell:

```powershell
$env:DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
```

Linux or WSL Bash:

```bash
export DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
```

Replace the placeholder with the real key. Do not type the placeholder
literally.

### `Model discovery failed`

The provider catalog could not be reached, the key may be expired, or a
firewall may be blocking the request. Check the key and network, then retry:

```powershell
omo-router sync deepinfra
```

The CLI exits nonzero and reports a concise actionable error instead of
printing a JavaScript stack trace for expected provider or catalog failures.

## License

Add the project license before distributing this package.
