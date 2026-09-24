#!/usr/bin/env node

import { chmodSync, existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import process from "node:process"
import { getProvider } from "./provider-presets.mjs"

const provider = process.argv[2]
if (!provider) {
  console.error("Provider name is required.")
  process.exitCode = 1
} else {
  const config = getProvider(provider)
  const agentDir = process.env.OMO_CODING_AGENT_DIR || join(homedir(), ".omo", "agent")
  const keyPath = join(agentDir, `${provider}-api-key`)
  const key = process.env[config.envKey] ||
    (existsSync(keyPath) ? readFileSync(keyPath, "utf8").trim() : "")

  if (!key) {
    console.error(`${config.envKey} not found`)
    process.exitCode = 1
  } else {
    try {
      chmodSync(keyPath, 0o600)
    } catch {
      // Windows ACLs are managed by the user profile.
    }
    process.stdout.write(key.trim())
  }
}
