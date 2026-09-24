# Threads 카드뉴스 — omo-router

## 게시 계정

- Target: `@myungsik.ji`
- Format: 6장 이미지 카드뉴스 + 본문 캡션
- Language: Korean

## Caption

여러 AI provider를 OMO에서 바꿔 쓸 때마다 설정 파일을 직접 고치고
모델 ID를 복사하고 계셨나요?

`omo-router`는 API key 하나로 provider와 모델을 OMO에 등록하고,
provider의 공식 모델 목록까지 자동으로 `/model` 메뉴에 추가합니다.

DeepInfra, OpenRouter, Together AI, Groq, OpenGateway를 지원합니다.
CC Switch 없이도 사용할 수 있어요.

GitHub: https://github.com/JIMyungSik/omo-adapter
npm: https://www.npmjs.com/package/omo-router

#OMO #AI개발 #개발도구 #LLM #DeepInfra #OpenRouter

## Card 1 — 문제

### OMO에서 provider 바꾸기

매번 반복되는 작업:

- API endpoint 찾기
- 모델 ID 복사하기
- 설정 파일 수정하기
- key가 노출되지 않았는지 확인하기

이 과정을 한 번에 줄여보세요.

## Card 2 — 해결책

### `omo-router`

```text
provider 선택
       ↓
API key 저장
       ↓
공식 모델 catalog 조회
       ↓
OMO /model 목록에 자동 등록
```

CC Switch 없이 native OMO 설정을 사용합니다.

## Card 3 — 설치

```bash
npm install --global omo-router
```

또는:

```bash
npx --yes omo-router@0.1.3 list
```

## Card 4 — API key 등록

```bash
export DEEPINFRA_API_KEY="your-key"
omo-router key deepinfra
```

key는 OMO agent 디렉터리에 저장되고,
`models.json`이나 저장소에는 들어가지 않습니다.

## Card 5 — 모델 선택

```bash
omo-router use deepinfra deepseek-flash
omo
```

OMO 안에서:

```text
/model
```

자동 등록된 모델과 curated preset 중에서 선택합니다.

## Card 6 — 지원 provider

현재 지원:

- DeepInfra
- OpenRouter
- Together AI
- Groq
- OpenGateway

이미 저장한 key의 모델 목록을 다시 가져오려면:

```bash
omo-router sync openrouter
```

GitHub에서 확인해보세요.
