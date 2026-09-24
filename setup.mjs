#!/usr/bin/env node

import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import process from "node:process"

const home = process.env.OMO_DEEPINFRA_HOME || homedir()
const agentDir = process.env.OMO_CODING_AGENT_DIR || join(home, ".omo", "agent")
const keyPath = join(agentDir, "deepinfra-api-key")
const key = process.env.DEEPINFRA_API_KEY?.trim()

if (!key) {
  console.error("Set DEEPINFRA_API_KEY, then run this command again.")
  console.error("PowerShell: $env:DEEPINFRA_API_KEY = '...'; node setup.mjs")
  console.error("macOS/Linux: DEEPINFRA_API_KEY='...' node setup.mjs")
  process.exitCode = 1
} else {
  mkdirSync(agentDir, { recursive: true })
  writeFileSync(keyPath, `${key}\n`, { encoding: "utf8", mode: 0o600 })
  try {
    chmodSync(keyPath, 0o600)
  } catch {
    // Windows ACLs are managed by the user profile; POSIX mode is best-effort.
  }
  console.log(`Stored the DeepInfra API key at ${keyPath}`)
}
