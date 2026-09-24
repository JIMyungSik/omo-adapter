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
npx --yes omo-router@0.1.6 --help
```

현재 `omo-deepinfra-adapter` source checkout 폴더 안에서는 package 이름이
`omo-router`와 같아 npx가 로컬 bin을 잘못 찾을 수 있습니다. 이 경우 홈
디렉터리 등 다른 위치에서 실행하세요.

```bash
cd ~
npx --yes omo-router@0.1.6 list
```

설정 변경 전 다음 파일을 timestamp backup으로 보관합니다.

- `~/.omo/agent/models.json`
- `~/.omo/agent/settings.json`
- `~/.omo/omo.jsonc`

## 운영체제별 명령어 규칙

아래 명령어는 한 줄씩 따로 실행하세요. 두 명령을 줄바꿈 없이 붙이면
`deepseek-flashomo-router`처럼 하나의 잘못된 preset 이름으로 해석됩니다.

### Windows PowerShell

```powershell
$env:DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
```

### Windows CMD

```cmd
set DEEPINFRA_API_KEY=your-deepinfra-key
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
```

### Linux Bash

```bash
export DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
```

PowerShell에서는 `export`를 사용하지 않습니다. Linux Bash에서는
`$env:...`를 사용하지 않습니다.

## Windows 전체 설치 절차

PowerShell을 열고 다음 명령을 한 줄씩 실행하세요.

```powershell
node --version
npm install --global omo-router@0.1.6
omo-router --help
$env:DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
omo-router current
omo
```

`omo-router key deepinfra`가 성공하면 key 저장과 모델 catalog 동기화가
진행됩니다. OMO가 이미 실행 중이었다면 종료 후 다시 실행하세요. OMO 안에서
`/model`을 입력하면 등록된 모델을 선택할 수 있습니다.

전역 설치 대신 다음처럼 실행할 수도 있습니다.

```powershell
npx --yes omo-router@0.1.6 list
npx --yes omo-router@0.1.6 key deepinfra
npx --yes omo-router@0.1.6 use deepinfra deepseek-flash
```

## Linux 전체 설치 절차

터미널에서 다음 명령을 한 줄씩 실행하세요.

```bash
node --version
npm install --global omo-router@0.1.6
omo-router --help
export DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
omo-router current
omo
```

새 터미널에서도 환경변수를 사용하려면 shell profile에 key를 넣을 수 있지만,
보안상 권장 방식은 `omo-router key deepinfra`로 agent key 파일에 저장한 뒤
export 값을 지우는 것입니다.

## DeepInfra 설정

```powershell
# Windows PowerShell
$env:DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
omo-router use deepinfra deepseek-flash
```

```bash
# Linux Bash
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

OMO가 이미 실행 중이라면 `key`, `sync`, `use` 실행 후 OMO를 종료하고 다시
실행하세요. OMO는 시작할 때 provider/model 설정을 읽으므로 재실행해야
`/model` 목록과 새 기본 모델이 정확히 반영됩니다.

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

## 문제 해결

### `deepseek-flashomo-router` 오류

두 명령이 붙어서 입력된 경우입니다. 아래처럼 각각 실행하세요.

```powershell
omo-router use deepinfra deepseek-flash
omo-router current
```

### `omo-router`를 찾을 수 없음

전역 설치를 확인하세요.

```powershell
npm install --global omo-router@0.1.6
where.exe omo-router
```

Linux에서는:

```bash
npm install --global omo-router@0.1.6
which omo-router
```

### `Unknown preset`

사용 가능한 preset을 확인하세요.

```text
deepseek-flash
deepseek-pro
qwen-coder
```

### `/model`에 새 모델이 보이지 않음

provider를 다시 동기화하고 OMO를 재실행하세요.

```powershell
omo-router sync deepinfra
```

### API key 관련 오류

PowerShell에서는 다음처럼 설정합니다.

```powershell
$env:DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
```

Linux/WSL에서는 다음처럼 설정합니다.

```bash
export DEEPINFRA_API_KEY="your-deepinfra-key"
omo-router key deepinfra
```

`Set DEEPINFRA_API_KEY before running "omo-router key deepinfra"`가 나오면
현재 셸에서 환경변수가 설정되지 않은 것입니다. 실제 key 대신
`your-deepinfra-key`를 그대로 입력하면 안 됩니다.

### `Model discovery failed`

provider catalog에 연결하지 못했거나 key가 만료된 경우입니다.

1. key와 provider를 확인합니다.
2. 인터넷 연결과 방화벽을 확인합니다.
3. 같은 셸에서 `omo-router sync deepinfra`를 다시 실행합니다.
4. 계속 실패하면 OMO를 실행하기 전에 provider 공식 endpoint 상태를
   확인합니다.

CLI는 실패 시 non-zero exit code를 반환하며 JavaScript stack trace 대신
사용자가 처리할 수 있는 오류 메시지를 출력합니다.
