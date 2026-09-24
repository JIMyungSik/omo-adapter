# omo-router

Native OMO/Senpi에서 provider를 바꾸고, API key를 기준으로 모델 목록을
자동 등록하는 CLI입니다.

`omo-router`는 `~/.omo/agent` 아래의 OMO custom-provider 설정만 변경합니다.
OMO 내부 코드를 수정하지 않으며 CC Switch도 필요하지 않습니다.

## 준비 사항

- Node.js 22 이상
- Native OMO (`omo`)
- 사용할 provider의 API key

## 설치

전역 설치:

```bash
npm install --global omo-router
```

전역 설치 없이 실행:

```bash
npx --yes omo-router@0.1.3 --help
```

현재 `omo-deepinfra-adapter` source checkout 폴더 안에서는 package 이름이
`omo-router`와 같아 npx가 로컬 bin을 잘못 찾을 수 있습니다. 이 경우 홈
디렉터리 등 다른 위치에서 실행하세요.

```bash
cd ~
npx --yes omo-router@0.1.3 list
```

설정 변경 전 다음 파일을 timestamp backup으로 보관합니다.

- `~/.omo/agent/models.json`
- `~/.omo/agent/settings.json`
- `~/.omo/omo.jsonc`

## DeepInfra 설정

```bash
export DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
```

DeepInfra preset:

- `deepseek-flash`
- `deepseek-pro`
- `qwen-coder`

DeepInfra는 Anthropic-compatible endpoint를 사용합니다.

```text
https://api.deepinfra.com/anthropic
```

## OpenRouter 설정

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
omo-router key openrouter
omo-router use openrouter deepseek-free
```

OpenRouter preset:

- `deepseek-free`
- `qwen-coder`

## Together AI 설정

```bash
export TOGETHER_API_KEY="your-together-key"
omo-router key together
omo-router use together minimax
```

## Groq 설정

```bash
export GROQ_API_KEY="your-groq-key"
omo-router key groq
omo-router use groq llama
```

## OpenGateway 설정

```bash
export OPENGATEWAY_API_KEY="your-opengateway-key"
omo-router key opengateway
omo-router use opengateway deepseek-fast
```

## API key 기반 모델 자동 등록

다음 명령을 실행하면 key를 저장한 뒤 provider 공식 `/models` catalog를
조회하고, 사용 가능한 모델을 OMO의 `/model` 목록에 자동으로 추가합니다.

```bash
omo-router key openrouter
```

이미 key가 저장되어 있다면 다음 명령으로 다시 동기화합니다.

```bash
omo-router sync openrouter
omo-router sync deepinfra
```

기존 curated preset은 삭제하지 않습니다. API key는 요청의
`Authorization: Bearer` header에서만 사용하며 `models.json`에 저장하거나
터미널에 출력하지 않습니다.

## OMO에서 모델 선택

provider를 한 번 등록합니다.

```bash
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
omo
```

OMO 안에서 다음 명령을 입력합니다.

```text
/model
```

자동 등록된 모델과 기본 preset을 목록에서 선택할 수 있습니다.

현재 상태 확인:

```bash
omo-router list
omo-router current
```

curated preset에 없는 모델을 직접 지정:

```bash
omo-router use openrouter --model deepseek/deepseek-r1
```

## CLI 명령어

```text
omo-router list
omo-router current
omo-router key <provider>
omo-router sync <provider>
omo-router use <provider> [preset]
omo-router use <provider> --model <provider-model-id>
```

`use`는 OMO 기본 provider/model과 alias를 변경합니다. 단, 실행할 때
`omo --model ...`을 직접 지정하면 해당 명령이 기본값보다 우선합니다.

## 보안 및 backup

- API key는 repository 밖 `~/.omo/agent`에 저장합니다.
- 지원되는 플랫폼에서는 key 파일 권한을 `0600`으로 설정합니다.
- OMO 요청 시점에만 key를 읽습니다.
- 변경 전 `.bak-provider-*` backup을 만듭니다.
- 실제 key를 shell history, README, test, git에 넣지 마세요.

## 개발자용 검증

```bash
npm test
node --check provider-switch.mjs
node --check model-catalog.mjs
```

테스트는 provider 전환, catalog 정규화, 자동 등록, backup, key 비노출을
검증합니다.
