# Provider research for OMO Router

Research date: 2026-09-24

## Selection

| Provider | Community signal | Official contract | OMO preset |
|---|---|---|---|
| DeepInfra | Existing Reddit discussion and current working local integration | Anthropic Messages-compatible endpoint | Default |
| OpenRouter | Repeated Reddit provider recommendations; gateway for many model families | OpenAI-compatible `https://openrouter.ai/api/v1` | `deepseek-free`, `qwen-coder` |
| Together AI | Listed among commonly used providers in Reddit API discussions | OpenAI-compatible `https://api.together.ai/v1` | `minimax`, `llama` |
| Groq | Listed among commonly used providers in Reddit API discussions | OpenAI-compatible `https://api.groq.com/openai/v1` | `llama`, `gpt-oss` |

## Evidence and limits

- Reddit search found provider discussions in
  `r/LocalLLaMA`, `r/ClaudeAI`, and `r/ChatGPTCoding`, including DeepInfra,
  OpenRouter, Together, and Groq.
- X search was attempted with three date-bound keyword queries, but the
  connected xAI credential was rejected. No X claim is used as evidence.
- Provider popularity is a directional community signal, not a usage census.
  Presets are included only where the provider publishes a documented
  OpenAI-compatible contract.
- Non-DeepInfra presets are configuration-only until the user supplies that
  provider's API key. DeepInfra remains the verified default.

## Official references

- OpenRouter API reference:
  https://openrouter.ai/docs/api_reference/overview
- Together AI OpenAI compatibility:
  https://docs.together.ai/docs/inference/openai-compatibility
- Groq OpenAI compatibility:
  https://console.groq.com/docs/openai
- Reddit community signal:
  https://www.reddit.com/r/LocalLLaMA/comments/14s4hou/free_llm_api/
- Reddit provider discussion:
  https://www.reddit.com/r/ClaudeAI/comments/1bz36c2/anyone_here_is_using_claude_via_api_whats_your/
